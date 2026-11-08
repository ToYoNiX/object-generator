/** The config a new object starts from: small, valid, and commented for someone new to Ergogen. */
export const starterConfig = `# A new object. This config is the source of truth: every file in the Files panel is
# generated from it, in your browser. Ergogen reference: https://docs.ergogen.xyz

# Points: where things go. Here, a 2 × 2 grid of key positions (U = 19.05 mm apart).
points:
  zones:
    matrix:
      columns:
        left:
        right:
      rows:
        bottom:
        top:

# Outlines: shapes placed on those points, then combined.
outlines:
  board:
    - what: rectangle
      where: true
      size: [U + 4, U + 4]
      corner: 2
  keys:
    - what: rectangle
      where: true
      size: [14, 14]
`;
