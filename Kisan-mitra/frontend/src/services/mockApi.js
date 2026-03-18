// src/services/mockApi.js
// Replace these implementations with real API calls later.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const sampleCrops = [
  {
    id: "c1",
    name: "Rice",
    plantingDate: "2025-07-01",
    stage: "Grain Filling",
    areaHectares: 2.5,
    notes: "Irrigated, high-yield variety",
  },
  {
    id: "c2",
    name: "Wheat",
    plantingDate: "2025-09-10",
    stage: "Tillering",
    areaHectares: 1.2,
    notes: "Sown after paddy",
  },
];

const sampleMachines = [
  {
    id: "m1",
    name: "Tractor X100",
    ownerName: "Ramesh",
    pricePerHour: 500,
    img: "",
  },
  {
    id: "m2",
    name: "Harvester H5",
    ownerName: "Suresh",
    pricePerHour: 1200,
    img: "",
  },
];

const sampleVacancies = [
  {
    id: "v1",
    title: "Harvest help",
    farmName: "Sunil Farm",
    skills: ["harvesting"],
    startDate: "2025-11-30",
    numWorkers: 6,
    ratePerDay: 350,
  },
  {
    id: "v2",
    title: "Weeding",
    farmName: "Raju Farm",
    skills: ["weeding"],
    startDate: "2025-12-05",
    numWorkers: 3,
    ratePerDay: 300,
  },
];

export const fetchFarmerProfile = async (userId) => {
  await delay(300);
  return {
    id: userId,
    name: "Sunil Gurav",
    farmingStyles: ["Irrigated Rice", "Organic Vegetables"],
    farmsCount: 2,
  };
};

export const fetchCropsForFarmer = async (farmId) => {
  await delay(300);
  return sampleCrops;
};

export const fetchAIPredictionsForFarm = async (farmId, horizon = 7) => {
  await delay(400);
  // simple mocked predictions
  return {
    horizon,
    weather: [
      { date: "2025-11-24", rainChance: 10 },
      { date: "2025-11-25", rainChance: 70 },
      { date: "2025-11-26", rainChance: 20 },
    ],
    tasks: [
      {
        date: "2025-11-25",
        action: "Avoid Harvest - heavy rain likely",
        confidence: 0.82,
      },
      {
        date: "2025-11-27",
        action: "Drain fields and prepare for harvesting",
        confidence: 0.66,
      },
    ],
  };
};

export const fetchMachineryNearby = async (farmId) => {
  await delay(300);
  return sampleMachines;
};

export const fetchVacancies = async (region) => {
  await delay(200);
  return sampleVacancies;
};

export const postVacancy = async (payload) => {
  await delay(300);
  return {
    ok: true,
    vacancy: { id: "v" + Math.floor(Math.random() * 1000), ...payload },
  };
};

export const bookMachine = async (machineId, payload) => {
  await delay(400);
  return {
    ok: true,
    bookingId: "b" + Math.floor(Math.random() * 10000),
    ...payload,
  };
};

export const fetchOwnerMachines = async (ownerId) => {
  await delay(300);
  return sampleMachines;
};

export const addMachineForOwner = async (ownerId, payload) => {
  await delay(300);
  return {
    ok: true,
    machine: { id: "m" + Math.floor(Math.random() * 10000), ...payload },
  };
};

export const fetchOwnerBookings = async (ownerId) => {
  await delay(300);
  return [
    {
      id: "bk1",
      machineId: "m1",
      farmerName: "Sunil",
      date: "2025-11-20",
      hours: 5,
      price: 2500,
      status: "confirmed",
    },
  ];
};

export const fetchLabourMatches = async (labourId) => {
  await delay(300);
  return sampleVacancies;
};

export const fetchLabourPredictions = async (labourId) => {
  await delay(300);
  return {
    next7DaysDemand: [2, 3, 1, 4, 2, 1, 3],
    skillFocus: ["harvesting", "weeding"],
  };
};

export const fetchWorkHistoryForLabour = async (labourId) => {
  await delay(200);
  return [
    {
      id: "wh1",
      farmName: "Sunil Farm",
      days: 3,
      payment: 1200,
      date: "2025-10-10",
    },
  ];
};
