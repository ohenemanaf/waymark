import type { Memory, Profile, Trip } from "../types"

/**
 * Sample journal for demo mode: a person based in Accra who has travelled over the last two years.
 * Photos are real pictures of each place from Wikimedia Commons, bundled in /public/demo and credited
 * in `seedPhotoCredits` as their licences require.
 */

export const seedProfile: Profile = {
  id: "demo-user",
  displayName: "Ama",
  approximateLocation: false,
  createdAt: "2025-03-10T09:12:00.000Z",
  email: null,
}

export const seedTrips: Trip[] = [
  { id: "trip-lisbon", name: "Lisbon long weekend", startDate: "2026-04-17", endDate: "2026-04-20", coverPhotoPath: "/demo/senhora.jpg", createdAt: "2026-04-21T19:40:00.000Z" },
  { id: "trip-kyoto", name: "Kyoto in autumn", startDate: "2025-11-08", endDate: "2025-11-12", coverPhotoPath: "/demo/kiyomizu.jpg", createdAt: "2025-11-14T08:05:00.000Z" },
  { id: "trip-skye", name: "Isle of Skye", startDate: "2025-07-02", endDate: "2025-07-05", coverPhotoPath: null, createdAt: "2025-07-06T21:30:00.000Z" },
  { id: "trip-marrakech", name: "Marrakech with Kofi", startDate: "2025-03-14", endDate: "2025-03-17", coverPhotoPath: "/demo/majorelle.jpg", createdAt: "2025-03-18T12:00:00.000Z" },
]

type SeedMemory = Omit<Memory, "updatedAt"> & { updatedAt?: string }

const memories: SeedMemory[] = [
  // ---- Home, recently (not in a trip)
  {
    id: "m-osu", tripId: null, placeName: "Oxford Street at night", address: "Oxford Street, Osu, Accra, Ghana",
    latitude: 5.556, longitude: -0.182, visitedOn: "2026-10-31",
    note: "Forgot to take a photo. Kelewele from the woman outside the bank, still the best on the street.",
    photoPath: null, tags: ["food", "home"], createdAt: "2026-10-31T22:48:00.000Z",
  },
  {
    id: "m-labadi", tripId: null, placeName: "Labadi Beach", address: "La Beach Road, Labadi, Accra, Ghana",
    latitude: 5.56, longitude: -0.145, visitedOn: "2026-10-04",
    note: "Sunday afternoon with the cousins. Drummers set up near the umbrellas around four and nobody left until dark.",
    photoPath: "/demo/labadi.jpg", tags: ["beach", "weekend", "home"], createdAt: "2026-10-04T18:20:00.000Z",
  },
  // These two form a suggested trip on the Trips page.
  {
    id: "m-kakum", tripId: null, placeName: "Kakum canopy walkway", address: "Kakum National Park, Central Region, Ghana",
    latitude: 5.35, longitude: -1.383, visitedOn: "2026-08-23",
    note: "Seven rope bridges, forty metres up. Hornbills calling somewhere below the whole way across. My knees have opinions.",
    photoPath: "/demo/kakum.jpg", tags: ["nature", "adventure"], createdAt: "2026-08-23T15:02:00.000Z",
  },
  {
    id: "m-capecoast", tripId: null, placeName: "Cape Coast Castle", address: "Victoria Road, Cape Coast, Ghana",
    latitude: 5.1036, longitude: -1.2414, visitedOn: "2026-08-22",
    note: "A quiet, heavy afternoon. The guide spoke slowly and nobody asked questions until the end. Fishing boats painted every colour on the beach outside afterwards.",
    photoPath: "/demo/capecoast.jpg", tags: ["history", "coast"], createdAt: "2026-08-22T17:31:00.000Z",
  },
  {
    id: "m-bled", tripId: null, placeName: "Lake Bled", address: "Bled, Upper Carniola, Slovenia",
    latitude: 46.3637, longitude: 14.0938, visitedOn: "2026-06-07",
    note: "Conference was in Ljubljana, so I stole a morning. Rowed out to the island before the crowds and rang the bell. Cream cake on the terrace after.",
    photoPath: "/demo/bled.jpg", tags: ["scenic", "food", "work-trip"], createdAt: "2026-06-07T11:15:00.000Z", updatedAt: "2026-06-09T20:02:00.000Z",
  },

  // ---- Lisbon long weekend
  {
    id: "m-pena", tripId: "trip-lisbon", placeName: "Pena Palace", address: "Estrada da Pena, Sintra, Portugal",
    latitude: 38.7876, longitude: -9.3906, visitedOn: "2026-04-20",
    note: "Fog rolled in and out all morning, so every view was a surprise. Took the 434 bus up; walked down through the park.",
    photoPath: "/demo/pena.jpg", tags: ["day-trip", "scenic"], createdAt: "2026-04-20T13:44:00.000Z",
  },
  {
    id: "m-belem", tripId: "trip-lisbon", placeName: "Belém Tower", address: "Av. Brasília, Belém, Lisbon, Portugal",
    latitude: 38.6916, longitude: -9.216, visitedOn: "2026-04-19",
    note: "Didn't go in, the queue was an hour. Pastéis de nata still warm from Pastéis de Belém, eaten on the steps by the river instead. Right call.",
    photoPath: "/demo/belem.jpg", tags: ["food", "history"], createdAt: "2026-04-19T12:10:00.000Z",
  },
  {
    id: "m-timeout", tripId: "trip-lisbon", placeName: "Time Out Market", address: "Av. 24 de Julho 49, Cais do Sodré, Lisbon, Portugal",
    latitude: 38.7069, longitude: -9.1459, visitedOn: "2026-04-18",
    note: null, photoPath: "/demo/timeout.jpg", tags: ["food"], createdAt: "2026-04-18T20:55:00.000Z",
  },
  {
    id: "m-tram28", tripId: "trip-lisbon", placeName: "Tram 28 through Alfama", address: "Rua das Escolas Gerais, Alfama, Lisbon, Portugal",
    latitude: 38.711, longitude: -9.13, visitedOn: "2026-04-18",
    note: "Waited for one that wasn't packed and rode it end to end. The bends are so tight you could touch the windows.",
    photoPath: "/demo/tram28.jpg", tags: ["city"], createdAt: "2026-04-18T10:37:00.000Z",
  },
  {
    id: "m-senhora", tripId: "trip-lisbon", placeName: "Miradouro da Senhora do Monte", address: "Largo Monte, Graça, Lisbon, Portugal",
    latitude: 38.7192, longitude: -9.1325, visitedOn: "2026-04-17",
    note: "First evening. Climbed up straight from the airport with our bags. The whole city went pink and the castle lit up.",
    photoPath: "/demo/senhora.jpg", tags: ["sunset", "scenic", "weekend"], createdAt: "2026-04-17T19:58:00.000Z",
  },

  // ---- Kyoto in autumn
  {
    id: "m-nishiki", tripId: "trip-kyoto", placeName: "Nishiki Market", address: "Nishikikoji-dori, Nakagyo Ward, Kyoto, Japan",
    latitude: 35.005, longitude: 135.7649, visitedOn: "2025-11-12",
    note: "Tamagoyaki on a stick, soy milk doughnuts and far too many pickles. Bought a knife I definitely did not need.",
    photoPath: "/demo/nishiki.jpg", tags: ["food", "market"], createdAt: "2025-11-12T14:21:00.000Z",
  },
  {
    id: "m-kiyomizu", tripId: "trip-kyoto", placeName: "Kiyomizu-dera", address: "1-294 Kiyomizu, Higashiyama Ward, Kyoto, Japan",
    latitude: 34.9949, longitude: 135.785, visitedOn: "2025-11-11",
    note: "The maples were at their peak. Walked up through Sannenzaka in the rain and it was worth every step.",
    photoPath: "/demo/kiyomizu.jpg", tags: ["temple", "scenic"], createdAt: "2025-11-11T09:48:00.000Z",
  },
  {
    id: "m-arashiyama", tripId: "trip-kyoto", placeName: "Arashiyama Bamboo Grove", address: "Sagaogurayama, Ukyo Ward, Kyoto, Japan",
    latitude: 35.017, longitude: 135.6713, visitedOn: "2025-11-10",
    note: "Got there at 7am. Worth it for the sound of the wind in the bamboo alone. By nine you couldn't move.",
    photoPath: "/demo/arashiyama.jpg", tags: ["nature", "early-start"], createdAt: "2025-11-10T07:26:00.000Z",
  },
  {
    id: "m-inari", tripId: "trip-kyoto", placeName: "Fushimi Inari Taisha", address: "68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto, Japan",
    latitude: 34.9671, longitude: 135.7727, visitedOn: "2025-11-08",
    note: "Climbed all the way to the summit. Legs did not thank me. The higher you go, the quieter it gets.",
    photoPath: "/demo/inari.jpg", tags: ["temple", "hike"], createdAt: "2025-11-08T16:03:00.000Z",
  },

  // ---- Isle of Skye
  {
    id: "m-portree", tripId: "trip-skye", placeName: "Portree harbour", address: "Quay Street, Portree, Isle of Skye, Scotland",
    latitude: 57.4125, longitude: -6.1946, visitedOn: "2025-07-05",
    note: "Fish and chips on the harbour wall, coloured houses, and the first proper sun in three days.",
    photoPath: "/demo/portree.jpg", tags: ["food", "coast"], createdAt: "2025-07-05T18:12:00.000Z",
  },
  {
    id: "m-neist", tripId: "trip-skye", placeName: "Neist Point lighthouse", address: "Neist Point, Glendale, Isle of Skye, Scotland",
    latitude: 57.4234, longitude: -6.7887, visitedOn: "2025-07-04",
    note: "Wind strong enough to lean on. Saw a minke whale, or possibly a rock. Choosing to believe whale.",
    photoPath: "/demo/neist.jpg", tags: ["coast", "scenic"], createdAt: "2025-07-04T21:40:00.000Z",
  },
  {
    id: "m-fairy", tripId: "trip-skye", placeName: "Fairy Pools", address: "Glenbrittle, Isle of Skye, Scotland",
    latitude: 57.2497, longitude: -6.2556, visitedOn: "2025-07-03",
    note: "Freezing, impossibly clear water. Kofi swam. I held the towels.",
    photoPath: "/demo/fairy.jpg", tags: ["hike", "nature"], createdAt: "2025-07-03T14:55:00.000Z",
  },
  {
    id: "m-storr", tripId: "trip-skye", placeName: "Old Man of Storr", address: "Trotternish, Isle of Skye, Scotland",
    latitude: 57.5074, longitude: -6.183, visitedOn: "2025-07-02",
    note: null, photoPath: "/demo/storr.jpg", tags: ["hike", "scenic"], createdAt: "2025-07-02T12:30:00.000Z",
  },

  // ---- Marrakech
  {
    id: "m-benyoussef", tripId: "trip-marrakech", placeName: "Ben Youssef Madrasa", address: "Rue Assouel, Medina, Marrakesh, Morocco",
    latitude: 31.6324, longitude: -7.9862, visitedOn: "2025-03-16",
    note: "Every surface carved, tiled or painted. Sat by the pool in the courtyard for twenty minutes just looking up.",
    photoPath: "/demo/benyoussef.jpg", tags: ["history", "architecture"], createdAt: "2025-03-16T11:18:00.000Z",
  },
  {
    id: "m-majorelle", tripId: "trip-marrakech", placeName: "Jardin Majorelle", address: "Rue Yves Saint Laurent, Marrakesh, Morocco",
    latitude: 31.6417, longitude: -8.0033, visitedOn: "2025-03-15",
    note: "That blue is real. Book tickets online the night before; the walk-up line went round the block.",
    photoPath: "/demo/majorelle.jpg", tags: ["garden", "scenic"], createdAt: "2025-03-15T10:42:00.000Z",
  },
  {
    id: "m-jemaa", tripId: "trip-marrakech", placeName: "Jemaa el-Fnaa", address: "Jemaa el-Fnaa, Medina, Marrakesh, Morocco",
    latitude: 31.6258, longitude: -7.9891, visitedOn: "2025-03-14",
    note: "Arrived at dusk as the food stalls lit up. Orange juice for four dirham and the call to prayer over everything.",
    photoPath: "/demo/jemaa.jpg", tags: ["food", "market", "sunset"], createdAt: "2025-03-14T19:25:00.000Z",
  },
]

export const seedMemories: Memory[] = memories.map((m) => ({ ...m, updatedAt: m.updatedAt ?? m.createdAt }))

export type PhotoCredit = { author: string; license: string; source: string }

/** Attribution for the bundled sample photos (Wikimedia Commons). */
export const seedPhotoCredits: Record<string, PhotoCredit> = {
  "/demo/senhora.jpg": { author: "Reino Baptista", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:O_Castelo_de_S%C3%A3o_Jorge_e_a_cidade_de_Lisboa_vistos_do_Miradouro_da_Senhora_do_Monte.jpg" },
  "/demo/timeout.jpg": { author: "Vitor Oliveira", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Mercado_da_Ribeira_(Time_Out_Market)_-_Lisboa_-_Portugal_(51018939231).jpg" },
  "/demo/belem.jpg": { author: "Norbert Nagel", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Torre_de_Bel%C3%A9m_and_wooden_bridge_-_landscape_view_-_Lisbon_-_2026-05-14.jpg" },
  "/demo/pena.jpg": { author: "CEphoto, Uwe Aranas", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Sintra_Portugal_Pal%C3%A1cio_da_Pena-01.jpg" },
  "/demo/tram28.jpg": { author: "Shadowgate", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Tram_28_(34791358090).jpg" },
  "/demo/inari.jpg": { author: "Paul Vlaar", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:KyotoFushimiInariLarge.jpg" },
  "/demo/arashiyama.jpg": { author: "Naokijp", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:2021_Sagano_Bamboo_forest_in_Arashiyama,_Kyoto,_Japan.jpg" },
  "/demo/nishiki.jpg": { author: "collinox", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Tsukemono_shop_by_collinox_in_Nishiki_Ichiba,_Kyoto.jpg" },
  "/demo/kiyomizu.jpg": { author: "Martin Falbisoner", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Kiyomizu-dera,_Kyoto,_November_2016_-01.jpg" },
  "/demo/storr.jpg": { author: "Doris Feigl", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Old_Man_Of_Storr_(148017623).jpeg" },
  "/demo/fairy.jpg": { author: "Wojtek Szkutnik", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:The_Fairy_Pools_(228835567).jpeg" },
  "/demo/portree.jpg": { author: "הגמל התימני", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Portree_Isle_of_Skye_-_September_2023.jpg" },
  "/demo/neist.jpg": { author: "Lionel Ulmer", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Neist_Point_Lighthouse_20140624_182526_P1110708.jpg" },
  "/demo/jemaa.jpg": { author: "Herokk", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Jemaa_el-Fnaa_Marrakech_at_sunset.jpg" },
  "/demo/majorelle.jpg": { author: "Viault", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Le_jardin_des_majorelle_16.JPG" },
  "/demo/benyoussef.jpg": { author: "R Prazeres", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Ben_Youssef_Madrasa_DSCF6013.jpg" },
  "/demo/capecoast.jpg": { author: "Matti Blume", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Castle,_Cape_Coast_(P1100223).jpg" },
  "/demo/kakum.jpg": { author: "daSupremo", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Canopy_walkway_in_Kakum_National_Park_2.jpg" },
  "/demo/bled.jpg": { author: "Jakub Hałun", license: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Bled_Island_in_Lake_Bled,_Slovenia,_20240504_0858_8292.jpg" },
  "/demo/labadi.jpg": { author: "Ghassan Mroue", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Labadi_beach_-_Ghana_,_Accra_sept_09_-_panoramio.jpg" },
}
