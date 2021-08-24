import {
  EdgeMapping,
  FruchtermanReingoldLayoutOptions,
  LayoutMapping,
} from './utils';

export function fruchtermanReingoldImpl(
  nodes: string[],
  edges: EdgeMapping,
  options: FruchtermanReingoldLayoutOptions,
  cb?: (layout: LayoutMapping, i: number) => void
): LayoutMapping {
  /**
   * Calculate the length of a vector with arbitrary dimensions.
   *
   * @param {number[]} v
   * @return {*}  {number}
   */
  const lengthVector = (v: number[]): number =>
    Math.sqrt(v.reduce((prev, cur) => prev + cur * cur, 0));

  const w = nodes.length; // { W and L are the width and length of the frame }
  const l = nodes.length;

  const area = w * l;
  const k = options.C * Math.sqrt(area / nodes.length);

  const fa = (d: number) => (d * d) / k;
  const fr = (d: number) => (k * k) / d;

  const positions = nodes.reduce((prev, nodeKey) => {
    prev[nodeKey] = {
      x: (Math.random() * w - w / 2) / 2,
      y: (Math.random() * l - l / 2) / 2,
    };
    return prev;
  }, {} as LayoutMapping);

  let t = w / 10.0;
  const cool = (t: number) => t / (options.iterations + 1.0); // ? maybe better cooling function eg quenching and simmering

  for (let i = 0; i < options.iterations; i++) {
    // { calculate repulsive forces }
    const repulsiveDisplacements = Object.keys(positions).reduce((prev, v) => {
      const vPos = positions[v];
      const displacement = Object.keys(positions).reduce(
        (disp, u) => {
          const uPos = positions[u];
          if (v !== u) {
            const d = [vPos.x - uPos.x, vPos.y - uPos.y];

            const delta = lengthVector(d);

            // Nodes that are far apart (1000 * k) are not worth computing
            if (delta !== 0 || delta > 1000 * k) {
              const force = fr(delta);

              disp.x += (d[0] / delta) * force;
              disp.y += (d[1] / delta) * force;
            }
          }
          return disp;
        },
        { x: 0, y: 0 }
      );
      prev[v] = displacement;
      return prev;
    }, {} as LayoutMapping);

    // { calculate attractive forces }
    const attractiveDisplacements = Object.keys(edges).reduce((prev, edge) => {
      const { source, target } = edges[edge];
      const weight = edges[edge].weigth || 1;

      const d = [
        positions[source].x - positions[target].x,
        positions[source].y - positions[target].y,
      ];
      const delta = lengthVector(d);

      // Nodes that are far apart (1000 * k) are not worth computing
      if (delta !== 0 || delta > 1000 * k) {
        const force = fa(delta);
        const scaleByWeight = Math.pow(weight, options.edgeWeightInfluence);

        prev[source].x -= (d[0] / delta) * force * scaleByWeight;
        prev[source].y -= (d[1] / delta) * force * scaleByWeight;
        prev[target].x += (d[0] / delta) * force * scaleByWeight;
        prev[target].y += (d[1] / delta) * force * scaleByWeight;
      }
      return prev;
    }, repulsiveDisplacements);

    // { limit the maximum displacement to the temperature t }
    // { and then prevent from being displaced outside frame }
    // Also apply some gravity and speed (not standard furchterman reingold)
    Object.keys(positions).forEach((v) => {
      const vPos = positions[v];
      const d = [attractiveDisplacements[v].x, attractiveDisplacements[v].y];

      // Gravity
      const diffFromCenter = lengthVector([vPos.x, vPos.y]);
      const gravityForce = 0.01 * k * options.gravity * diffFromCenter;
      d[0] -= (gravityForce * vPos.x) / diffFromCenter;
      d[1] -= (gravityForce * vPos.y) / diffFromCenter;

      // Speed
      d[0] *= options.speed;
      d[1] *= options.speed;

      const delta = lengthVector(d);

      if (delta !== 0) {
        // limit the maximum displacement to the temperature t * speed
        const maxDisplacement = Math.min(delta, t * options.speed);

        // Apply displacement
        const x = vPos.x + (d[0] / delta) * maxDisplacement;
        const y = vPos.y + (d[1] / delta) * maxDisplacement;

        // prevent from being displaced outside frame
        positions[v].x = Math.min(w / 2, Math.max(-w / 2, x));
        positions[v].y = Math.min(l / 2, Math.max(-l / 2, y));
      }
    });

    t = cool(t);

    cb?.(positions, i);
  }

  return positions;
}
