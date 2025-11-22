export const LAYOUT_STRING = `
%%%%%%%%%%%%%%%%%%%%
%......%G  G%......%
%.%%...%%  %%...%%.%
%.%o.%........%.o%.%
%.%%.%.%%%%%%.%.%%.%
%........P.........%
%%%%%%%%%%%%%%%%%%%%
`;

export const CELL_TYPES = {
  WALL: '%',
  FOOD: '.',
  CAPSULE: 'o',
  GHOST: 'G',
  PACMAN: 'P',
  EMPTY: ' '
};

export const SCARED_TIME = 40;