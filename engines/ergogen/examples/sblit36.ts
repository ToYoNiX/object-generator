import type { EngineExample } from "../../types";

/**
 * Sblit36, a 36-key split keyboard by ToYoNiX. Copied from config.yaml in
 * https://github.com/ToYoNiX/sblit36 (MIT, Copyright (c) 2026 Assem Mohamed).
 */
export const sblit36: EngineExample = {
  id: "sblit36",
  label: "Sblit36",
  author: "ToYoNiX",
  config: `
units:
  kx: u
  ky: u
  px: 0
  py: 0

points:
  key.padding: ky
  zones:
    matrix:
      anchor:
        shift: [160, -160]
      columns:
        pinky:
          key:
            col_net: C0
            spread: kx
            stagger: 0
        ring:
          key:
            col_net: C1
            spread: 1.01kx
            stagger: 0.66 ky
        middle:
          key:
            col_net: C2
            spread: kx
            stagger: 0.125 ky
        index:
          key:
            col_net: C3
            spread: kx
            stagger: -0.125 ky
        inner:
          key:
            col_net: C4
            spread: kx
            stagger: -0.125 ky
      rows:
        top:
          row_net: R2
        home:
          row_net: R1
        bottom:
          row_net: R0

    thumbs:
      anchor:
        ref: matrix_inner_bottom
        shift: [-1.1kx, -3ky]
      columns:
        inner:
          key:
            spread: kx
            splay: -5
            origin: [-0.5 kx, -0.5 ky]
            col_net: C2
        home:
          key:
            spread: kx
            splay: -15
            origin: [-0.5 kx, -0.5 ky]
            col_net: C3
        outter:
          key:
            spread: kx
            splay: -15
            origin: [-0.5 kx, -0.5 ky]
            col_net: C4
      rows:
        thumb:
          row_net: R3
          rotate: 90

outlines:
  # ─── primitives ──────────────────────────────────────────────
  key_keycaps:
    - what: rectangle
      where: /matrix|thumbs/
      size: [kx - 1, ky - 1]

  key_switch_cutouts:
    - what: rectangle
      where: /matrix|thumbs/
      size: [14, 14]

  key_footprints:
    - what: rectangle
      where: /matrix|thumbs/
      size: [kx, ky]

  board_edge:
    - what: rectangle
      adjust:
        ref: matrix_middle_bottom
        shift: [11.5, -40.5]
      size: [119, 100]
      fillet: 3

  controller_cavity:
    - what: rectangle
      size: [30, 70]
      operation: add
    - what: rectangle
      adjust:
        shift: [14.1, -37.1]
        rotate: 55
      size: [30, 50]
      operation: add

  m3_nut_shape:
    - what: polygon
      adjust:
        shift: [-2.75, 1.5875]
      points:
        - shift: [0, -3.175]
        - shift: [2.75, -1.5875]
        - shift: [2.75, 1.5875]
        - shift: [0, 3.175]
        - shift: [-2.75, 1.5875]
        - shift: [-2.75, -1.5875]

  # ─── mounting holes & matching nuts (defined together) ───────
  mounting_holes:
    - what: circle
      where:
        ref: matrix_middle_bottom
        shift: [-44.5, 6]
      radius: 1.6
    - what: circle
      where:
        ref: matrix_middle_bottom
        shift: [46.5, 6]
      radius: 1.6
    - what: circle
      where:
        ref: matrix_middle_bottom
        shift: [-44.5, -87]
      radius: 1.6
    - what: circle
      where:
        ref: matrix_middle_bottom
        shift: [67.5, -87]
      radius: 1.6
    - what: circle
      where:
        ref: matrix_middle_bottom
        shift: [-10, -65]
      radius: 1.6

  m3_nuts:
    - what: outline
      name: m3_nut_shape
      where:
        ref: matrix_middle_bottom
        shift: [-44.5, 6]
    - what: outline
      name: m3_nut_shape
      where:
        ref: matrix_middle_bottom
        shift: [46.5, 6]
    - what: outline
      name: m3_nut_shape
      where:
        ref: matrix_middle_bottom
        shift: [-44.5, -87]
    - what: outline
      name: m3_nut_shape
      where:
        ref: matrix_middle_bottom
        shift: [67.5, -87]
    - what: outline
      name: m3_nut_shape
      where:
        ref: matrix_middle_bottom
        shift: [-10, -65]

  # ─── assembled layers ─────────────────────────────────────────
  plate_cutout:
    - what: outline
      name: key_footprints
      operation: add
    - what: outline
      name: board_edge
      operation: add
    - what: outline
      name: controller_cavity
      adjust:
        ref: matrix_middle_bottom
        shift: [65, -25]
      operation: subtract

  bottom_layer:
    - what: outline
      name: board_edge
      operation: add
    - what: outline
      name: plate_cutout
      operation: add
    - what: outline
      name: mounting_holes
      operation: stack

  switch_plate:
    - what: outline
      name: plate_cutout
      operation: add
    - what: outline
      name: key_switch_cutouts
      operation: subtract
    - what: outline
      name: mounting_holes
      operation: stack

  keycap_layer:
    - what: outline
      name: plate_cutout
      operation: add
    - what: outline
      name: key_keycaps
      operation: subtract

  pcb_layer:
    - what: outline
      name: board_edge
      operation: add
    - what: outline
      name: plate_cutout
      operation: add
    - what: outline
      name: m3_nuts
      operation: stack
    - what: outline
      name: mounting_holes
      operation: stack

pcbs:
  tnx_sblit36:
    template: kicad8
    outlines:
      edge:
        outline: pcb_layer

    footprints:
      mx_switches:
        what: mx
        where: /matrix|thumbs/
        params:
          from: "{{col_net}}"
          to: "{{row_net}}"
          hotswap: false
          stabilizers: false
          reverse: true
        adjust:
          rotate: -90

      diodes:
        what: diode
        where: /matrix|thumbs/
        adjust:
          shift: [-5, 0]
          rotate: 90
        params:
          from: "{{row_net}}"
          to: "{{row_net}}"
          pin_distance: 7.62
          smd: false

      switch_crossover:
        what: crossover
        where: /matrix/
        adjust:
          shift: [4, -6]
        params:
          from: "{{row_net}}"
          to: "{{row_net}}"

      encoder:
        what: rotary
        adjust:
          ref: matrix_inner_bottom
          shift: [23, -52]
          rotate: -125
        params:
          A: ENC_A
          B: ENC_B
          C: GND
          from: GND
          to: ENC_SWT
          legs: GND

      pro_micro:
        what: promicro
        where:
          ref: matrix_inner_bottom
          shift: [22.5, -4]
          rotate: -90
        params:
          RAW: RAW
          GND: GND
          RST: RST
          VCC: VCC
          P21: C0
          P20: C1
          P19: C2
          P18: C3
          P15: C4
          P14: R0
          P16: R1
          P10: R2
          P9: R3
          P8: ENC_A
          P7: ENC_B
          P6: ENC_SWT
          P2: SDA
          P3: SCL

      trrs:
        what: trrsbreakoutv3
        where:
          ref: matrix_inner_bottom
          shift: [23, -27.5]
        params:
          TIP: SCL
          R1: SDA
          R2: GND
          S: VCC
          NC_T1: ENC_B
          NC_T2: ENC_A
          NC_B1: ENC_B
          NC_B2: ENC_A
          reverse: true
          x_shift: 0
          y_shift: 3

      pullup_sda:
        what: resistor
        where:
          ref: matrix_inner_bottom
          shift: [23, -1]
        params:
          from: VCC
          to: SDA
          pin_distance: 8
          smd: false

      pullup_scl:
        what: resistor
        where:
          ref: matrix_inner_bottom
          shift: [23, -4]
        params:
          from: VCC
          to: SCL
          pin_distance: 8
          smd: false

      series_sda:
        what: resistor
        where:
          ref: matrix_inner_bottom
          shift: [22.5, -9]
        adjust:
          rotate: 90
        params:
          from: SDA
          to: SDA
          pin_distance: 5.08
          smd: false

      series_scl:
        what: resistor
        where:
          ref: matrix_inner_bottom
          shift: [25, -9]
        adjust:
          rotate: 90
        params:
          from: SCL
          to: SCL
          pin_distance: 5.08
          smd: false
`.trimStart(),
};
