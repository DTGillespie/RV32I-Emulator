class CPU {
  
  constructor(memorySize = 1024 * 1024) {
    this.registers = new Uint32Array(32);
    this.pc = 0;
    this.memory = new Uint8Array(memorySize);
  };

  fetch() {
    const instruction = this.memory[this.pc] |
      (this.memory[this.pc + 1] << 8)        |
      (this.memory[this.pc + 2] << 16)       |
      (this.memory[this.pc + 3] << 24);

    this.pc += 4;
    return instruction;
  };

  /*
    R-Type
    [ funct7 |  rs2  |  rs1  | funct3 |  rd  | opcode]
    [  31-25 | 24-20 | 19-15 | 14-12  | 11-7 |  6-0  ]

    I-Type
    [ imm[11:0] |  rs1  | funct3 |  rd  | opcode ]
    [   31-20   | 19-15 | 14-12  | 11-7 |   6-0  ]

    S-Type
    [ imm[11:5] |  rs2  |  rs1  | funct3 | imm[4:0] | opcode ]
    [   31-25   | 24-20 | 19-15 |  14-12 |   11-7   |   6-0  ]

    U-Type
    [ imm[31:12] |  rd  | opcode ]
    [  31 - 12   | 11-7 |   6-0  ]

    B-Type
    [ imm[12] | imm[10:5] |  rs2  |  rs1  | funct3 | imm[4:1] | imm[11] | opcode ]
    [   31    |   30-25   | 24-20 | 19-15 |  14-12 |   11-8   |    7    |  6-0   ]

    J-Type
    [ imm[20] | imm[10:1] | imm[11] | imm[19:12] |  rd  | opcode ]
    [   31    |  30-21    |   20    |   19-12    | 11-7 |   6-7  ]
  */

  decode(instruction) {
    const opcode = instruction & 0x7F;
    switch(opcode) {
      case 0x33:
        return this.decodeRType(instruction);
      case 0x13:
        return this.decodeIType(instruction);
      case 0x23:
        return this.decodeSType(instruction);
      case 0x63:
        return this.decodeBType(instruction);
      case 0x37:
        return this.decodeUType(instruction);
      case 0x6F:
        return this.decodeJType(instruction);
      default:
        throw new Error(`Unsupported opcode: ${opcode}`);
    };
  };

  decodeRType(instruction) {
    const [rd, funct3, rs1, rs2, funct7] = [
      (instruction >> 7)  & 0x1F,
      (instruction >> 12) & 0x07,
      (instruction >> 15) & 0x1F,
      (instruction >> 20) & 0x1F,
      (instruction >> 25) & 0x7F
    ];

    return {
      type: 'R',
      rd,
      rs1,
      rs2,
      funct3,
      funct7,
      opcode: instruction & 0x7F
    };
  };

  decodeIType(instruction) {
    const [rd, funct3, rs1] = [
      (instruction >> 7)  & 0x1F,
      (instruction >> 12) & 0x07,
      (instruction >> 15) & 0x1F,
    ];
    
    let imm = (instruction >> 20) & 0xFFF; // 12-bit immediate
    if (imm & 0x800) imm |= 0xFFFFF000; // Sign extended

    return {
      type: 'I',
      rd,
      rs1,
      imm,
      funct3,
      opcode: instruction & 0x7F
    };
  };

  decodeSType(instruction) {
    const [funct3, rs1, rs2] = [
      (instruction >> 12) & 0x07,
      (instruction >> 15) & 0x1F,
      (instruction >> 20) & 0x1F,
    ];
    
    let = ((instruction >> 7) & 0x1F) | ((instruction >> 25) << 5); // 12-bit immediate
    if (imm & 0x800) imm |= 0xFFFFF000; // Sign extended

    return {
      type: 'S',
      rs1,
      rs2,
      imm,
      funct3,
      opcode: instruction & 0x7F
    };
  };

  decodeBType(instruction) {
    const [funct3, rs1, rs2, imm11, imm4_1, imm10_5, imm12] = [
      (instruction >> 12) & 0x07,
      (instruction >> 15) & 0x1F,
      (instruction >> 20) & 0x1F,
      (instruction >> 7)  & 0x1 ,
      (instruction >> 8)  & 0xF ,
      (instruction >> 25) & 0x3F,
      (instruction >> 31) & 0x1 ,
    ];

    let imm = (imm12 << 12) | (imm11 << 11) | (imm10_5 << 5) | (imm4_1 << 1); // 13-bit immediate
    if (imm & 0x1000) imm |= 0xFFFFF000; // Sign extended

    return {
      type: 'B',
      rs1,
      rs2,
      imm,
      funct3,
      opcode: instruction & 0x7F
    };
  };
  
  decodeUType(instruction) {
    const [rd, imm] = [
      (instruction >> 7) & 0x1F,
      (instruction & 0xFFFFF000) // Upper 20 bits are the immediate
    ];

    return {
      type: 'U',
      rd,
      imm,
      opcode: instruction & 0x7F
    };
  };

  decodeJType(instruction) {
    const [rd, imm20, imm10_1, imm11, imm19_12] = [
      (instruction >> 7)  & 0x1F ,
      (instruction >> 31) & 0x1  ,
      (instruction >> 21) & 0x3FF,
      (instruction >> 20) & 0x1  ,
      (instruction >> 12) & 0xFF ,
    ];

    let imm = (imm20 << 20) | (imm19_12 << 12) | (imm11 << 11) | (imm10_1 << 1); // 21-bit immediate
    if (imm & 0x100000) imm |= 0xFFE00000; // Sign Extended

    return {
      type: 'J',
      rd,
      imm,
      opcode: instruction & 0x7F
    };
  };
};