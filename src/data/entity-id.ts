export enum EntityId {
  // Characters (0-999)
  Player = 0,
  Zombie = 1,
  PatientZero = 2,

  // Resources and Structures (1000-2000)
  FoodMine = 1000,
  WoodMine = 1001,
  StoneMine = 1002,
  GoldMine = 1003,

  WallWooden = 1050,
  WallStone = 1051,
  WallReinforced = 1052,

  SpikeWooden = 1053,
  SpikeStone = 1054,
  SpikeReinforced = 1055,

  TurretWooden = 1056,
  TurretStone = 1057,
  TurretReinforced = 1058,

  MinerWooden = 1059,
  MinerStone = 1060,
  MinerReinforced = 1061,

  SpeedBoost = 1062,
  HealingPad = 1063,
  RepairPad = 1064,
  AntiStructure = 1065,

  // Items (2001-3001)
  Food = 2001,
  Stick = 2010,
  AxeBasic = 2020,
  AxeNormal = 2021,
  AxeGreat = 2022,
  SwordBasic = 2030,
  SwordNormal = 2031,
  SwordGreat = 2032,
  SpearBasic = 2040,
  SpearNormal = 2041,
  SpearGreat = 2042,
  DaggerBasic = 2050,
  DaggerNormal = 2051,
  DaggerGreat = 2052,
  BowBasic = 2060,
  BowNormal = 2061,
  BowGreat = 2062,

  // Projectiles 3002-4002
  ArrowBasic = 3002,
  ArrowNormal = 3003,
  ArrowGreat = 3004,
  TurretArrowBasic = 3005,
  TurretArrowNormal = 3006,
  TurretArrowGreat = 3007,

  // Other
  Zone = 8000,
  None = 9999,
}
