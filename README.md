# Fruchterman Reingold

Implementation of the Fruchterman Reingold algorithm for Javascript and [graphology](https://graphology.github.io/). This implementation is compatible to [@ambalytics/webgraph](https://github.com/ambalytics/webgraph).

This implementation is based on the original algorithm published in 1991 (referenced below). I made several small additions:

- While calculating the forces of a node the implementation skips nodes that are far away (1000 * k). These nodes have a small (negligible) influence on the force.
- The attractive force are scaled by the link weight.
- The implementation supports a gravity forced directed to the center.
- The forces can be scaled by a speed setting.

(Btw: inspired by [graphology-layout-forceatlas2](https://github.com/graphology/graphology-layout-forceatlas2))

## Reference

> Fruchterman, T.M.J. and Reingold, E.M. (1991), Graph drawing by force-directed placement. Softw: Pract. Exper., 21: 1129-1164. [https://doi.org/10.1002/spe.4380211102](https://doi.org/10.1002/spe.4380211102)

## Installation

As this package hosted is on github packages, you have to login to this registry.  
You can find all details [here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package) and about the authentication [here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages).  
Basically you need to generate a PAT with at least `repo` and `read:packages` rights. Afterwards you have to call the login command stated below and enter your username, token as password and email when prompted.

```bash
npm login --scope=@ambalytics --registry=https://npm.pkg.github.com

npm install @ambalytics/graphology-layout-fruchtermanreingold
```

## Usage

### Settings

| parameter               |  type  | default  |                  decription                   |
| :---------------------- | :----: | :------: | :-------------------------------------------: |
| **iterations**          | number |   `10`   |     amount of iterations of the algorithm     |
| **edgeWeightInfluence** | number |   `1`    | influence of the edge's weights on the layout |
| **speed**               | number |   `1`    |           scaling factor for forces           |
| **gravity**             | number |   `10`   |       strength of the layout's gravity        |
| **C**                   | number |   `1`    |      C factor (scales the k coefficient)      |
| **weightAttribute**     | string | `weight` |        edge attribute to use as weight        |

### Synchronous layout

```js
import fruchtermanReingold from 'graphology-layout-fruchtermanreingold';

const positions = fruchtermanReingold(graph);

// With settings:
const positions = fruchtermanReingold(graph, {
  iterations: 50,
  edgeWeightInfluence: 5,
});

// To directly assign the positions to the nodes:
fruchtermanReingold.assign(graph);
```

#### Arguments

| parameter    |                    type                     |                  decription                   |
| :----------- | :-----------------------------------------: | :-------------------------------------------: |
| **graph**    |                    Graph                    |     amount of iterations of the algorithm     |
| **options?** | Partial\<FruchtermanReingoldLayoutOptions\> | influence of the edge's weights on the layout |

### Webworker

This library also supports the computation with a webworker. The syntax for that is nearly the same.
In this case the return values will be wrapped in a Promise.
To use the webworker you have to change the import statement to:

```js
import fruchtermanReingold from 'graphology-layout-fruchtermanreingold/worker';
```
