/**
 * HandyHub Pro Solutions — Master Dataset of all 36 Nigerian States + FCT Abuja
 */

import { NigerianState } from "./types";

export const INITIAL_NIGERIAN_STATES: NigerianState[] = [
  // 1. FCT Abuja (Active)
  {
    code: "FCT",
    name: "FCT Abuja",
    capital: "Abuja",
    zone: "NORTH_CENTRAL",
    zoneLabel: "North Central",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "AMAC (Maitama, Wuse 2, Garki, Asokoro, Jabi, Utako, Gwarinpa, Apo), Bwari (Kubwa), Gwagwalada, Kuje, Kwali, Abaji",
    lgas: ["Abaji", "Abuja Municipal (AMAC)", "Bwari", "Gwagwalada", "Kuje", "Kwali"],
    coordinates: { lat: 9.0765, lng: 7.4723 },
    activeArtisansCount: 420,
    activeEstatesCount: 310,
    totalBookingsCount: 14500,
    waitlistCount: 0,
    launchedAt: "2025-01-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },

  // 2. Lagos State (Active)
  {
    code: "LAGOS",
    name: "Lagos State",
    capital: "Ikeja",
    zone: "SOUTH_WEST",
    zoneLabel: "South West",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "Lekki Phase 1, Victoria Island, Ikoyi, Ikeja GRA, Magodo Phase 2, Surulere, Yaba, Maryland, Ajah, Sangotedo",
    lgas: [
      "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry",
      "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu",
      "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo",
      "Shomolu", "Surulere"
    ],
    coordinates: { lat: 6.5244, lng: 3.3792 },
    activeArtisansCount: 380,
    activeEstatesCount: 195,
    totalBookingsCount: 9800,
    waitlistCount: 0,
    launchedAt: "2025-06-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },

  // 3. Rivers State (Active)
  {
    code: "RIVERS",
    name: "Rivers State",
    capital: "Port Harcourt",
    zone: "SOUTH_SOUTH",
    zoneLabel: "South South",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "Port Harcourt City, Obio-Akpor (GRA Phase 1-3, Peter Odili, Woji, Rumuodara), Eleme, Ikwerre",
    lgas: [
      "Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru",
      "Bonny", "Degema", "Eleme", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana",
      "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro",
      "Oyigbo", "Port Harcourt", "Tai"
    ],
    coordinates: { lat: 4.8156, lng: 7.0498 },
    activeArtisansCount: 145,
    activeEstatesCount: 65,
    totalBookingsCount: 2900,
    waitlistCount: 0,
    launchedAt: "2026-01-15T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },

  // 4. Oyo State (Active)
  {
    code: "OYO",
    name: "Oyo State",
    capital: "Ibadan",
    zone: "SOUTH_WEST",
    zoneLabel: "South West",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "Ibadan North (Bodija, Agodi GRA), Ibadan North-West (Dugbe, Jericho), Oluyole, Ido",
    lgas: [
      "Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East",
      "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central",
      "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa",
      "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo",
      "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"
    ],
    coordinates: { lat: 7.3775, lng: 3.9470 },
    activeArtisansCount: 95,
    activeEstatesCount: 42,
    totalBookingsCount: 1400,
    waitlistCount: 0,
    launchedAt: "2026-03-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },

  // 5. Kano State (Active)
  {
    code: "KANO",
    name: "Kano State",
    capital: "Kano",
    zone: "NORTH_WEST",
    zoneLabel: "North West",
    isActive: true,
    status: "ACTIVE",
    coverageSummary: "Kano Municipal, Fagge, Dala, Gwale, Tarauni, Nassarawa GRA, Bompai Industrial Area",
    lgas: [
      "Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta",
      "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam",
      "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya",
      "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa",
      "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa",
      "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"
    ],
    coordinates: { lat: 12.0022, lng: 8.5920 },
    activeArtisansCount: 110,
    activeEstatesCount: 38,
    totalBookingsCount: 1850,
    waitlistCount: 0,
    launchedAt: "2026-04-10T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },

  // 6. Abia State (Inactive - Waitlist)
  {
    code: "ABIA",
    name: "Abia State",
    capital: "Umuahia",
    zone: "SOUTH_EAST",
    zoneLabel: "South East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Umuahia North, Umuahia South, Aba North, Aba South",
    lgas: [
      "Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North",
      "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo",
      "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi"
    ],
    coordinates: { lat: 5.5249, lng: 7.4943 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 342,
    updatedAt: new Date().toISOString(),
  },

  // 7. Adamawa State (Inactive)
  {
    code: "ADAMAWA",
    name: "Adamawa State",
    capital: "Yola",
    zone: "NORTH_EAST",
    zoneLabel: "North East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Yola North, Yola South, Jimeta, Girei, Mubi",
    lgas: [
      "Demsa", "Fufore", "Ganye", "Girei", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde",
      "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan",
      "Shelleng", "Song", "Toungo", "Yola North", "Yola South"
    ],
    coordinates: { lat: 9.3265, lng: 12.3984 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 184,
    updatedAt: new Date().toISOString(),
  },

  // 8. Akwa Ibom State (Inactive)
  {
    code: "AKWA_IBOM",
    name: "Akwa Ibom State",
    capital: "Uyo",
    zone: "SOUTH_SOUTH",
    zoneLabel: "South South",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Uyo Municipal, Eket, Ikot Ekpene, Oron",
    lgas: [
      "Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan",
      "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene",
      "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara",
      "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"
    ],
    coordinates: { lat: 5.0377, lng: 7.9128 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 520,
    updatedAt: new Date().toISOString(),
  },

  // 9. Anambra State (Inactive)
  {
    code: "ANAMBRA",
    name: "Anambra State",
    capital: "Awka",
    zone: "SOUTH_EAST",
    zoneLabel: "South East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Awka North, Awka South, Onitsha North, Onitsha South, Nnewi North",
    lgas: [
      "Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South",
      "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala",
      "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South",
      "Orumba North", "Orumba South", "Oyi"
    ],
    coordinates: { lat: 6.2209, lng: 7.0707 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 680,
    updatedAt: new Date().toISOString(),
  },

  // 10. Bauchi State (Inactive)
  {
    code: "BAUCHI",
    name: "Bauchi State",
    capital: "Bauchi",
    zone: "NORTH_EAST",
    zoneLabel: "North East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Bauchi Metropolis, Katagum, Misau",
    lgas: [
      "Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa",
      "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira",
      "Tafawa Balewa", "Toro", "Warji", "Zaki"
    ],
    coordinates: { lat: 10.3158, lng: 9.8442 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 215,
    updatedAt: new Date().toISOString(),
  },

  // 11. Bayelsa State (Inactive)
  {
    code: "BAYELSA",
    name: "Bayelsa State",
    capital: "Yenagoa",
    zone: "SOUTH_SOUTH",
    zoneLabel: "South South",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Yenagoa, Brass, Ogbia, Sagbama",
    lgas: [
      "Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"
    ],
    coordinates: { lat: 4.9267, lng: 6.2676 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 195,
    updatedAt: new Date().toISOString(),
  },

  // 12. Benue State (Inactive)
  {
    code: "BENUE",
    name: "Benue State",
    capital: "Makurdi",
    zone: "NORTH_CENTRAL",
    zoneLabel: "North Central",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Makurdi, Gboko, Otukpo, Katsina-Ala",
    lgas: [
      "Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala",
      "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu",
      "Otukpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"
    ],
    coordinates: { lat: 7.7321, lng: 8.5391 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 310,
    updatedAt: new Date().toISOString(),
  },

  // 13. Borno State (Inactive)
  {
    code: "BORNO",
    name: "Borno State",
    capital: "Maiduguri",
    zone: "NORTH_EAST",
    zoneLabel: "North East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Maiduguri Metropolitan, Jere, Biu",
    lgas: [
      "Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio",
      "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa",
      "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"
    ],
    coordinates: { lat: 11.8333, lng: 13.1500 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 160,
    updatedAt: new Date().toISOString(),
  },

  // 14. Cross River State (Inactive)
  {
    code: "CROSS_RIVER",
    name: "Cross River State",
    capital: "Calabar",
    zone: "SOUTH_SOUTH",
    zoneLabel: "South South",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Calabar Municipal, Calabar South, Akamkpa, Ikom, Ogoja",
    lgas: [
      "Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal",
      "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"
    ],
    coordinates: { lat: 4.9757, lng: 8.3417 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 390,
    updatedAt: new Date().toISOString(),
  },

  // 15. Delta State (Inactive)
  {
    code: "DELTA",
    name: "Delta State",
    capital: "Asaba",
    zone: "SOUTH_SOUTH",
    zoneLabel: "South South",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Asaba (Oshimili South), Warri South, Uvwie, Sapele, Ughelli",
    lgas: [
      "Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West",
      "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West",
      "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North",
      "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"
    ],
    coordinates: { lat: 6.1984, lng: 6.7262 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 710,
    updatedAt: new Date().toISOString(),
  },

  // 16. Ebonyi State (Inactive)
  {
    code: "EBONYI",
    name: "Ebonyi State",
    capital: "Abakaliki",
    zone: "SOUTH_EAST",
    zoneLabel: "South East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Abakaliki, Afikpo North, Izzi",
    lgas: [
      "Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South",
      "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"
    ],
    coordinates: { lat: 6.3249, lng: 8.1137 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 145,
    updatedAt: new Date().toISOString(),
  },

  // 17. Edo State (Inactive)
  {
    code: "EDO",
    name: "Edo State",
    capital: "Benin City",
    zone: "SOUTH_SOUTH",
    zoneLabel: "South South",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Oredo (GRA, Airport Road), Ikpoba-Okha, Egor, Ovia North-East",
    lgas: [
      "Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West",
      "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba-Okha", "Orhionmwon",
      "Oredo", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"
    ],
    coordinates: { lat: 6.3350, lng: 5.6037 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 620,
    updatedAt: new Date().toISOString(),
  },

  // 18. Ekiti State (Inactive)
  {
    code: "EKITI",
    name: "Ekiti State",
    capital: "Ado-Ekiti",
    zone: "SOUTH_WEST",
    zoneLabel: "South West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Ado-Ekiti, Ikere, Ijero",
    lgas: [
      "Ado-Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure",
      "Gbonyin", "Ido-Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun",
      "Ise/Orun", "Moba", "Oye"
    ],
    coordinates: { lat: 7.6210, lng: 5.2215 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 175,
    updatedAt: new Date().toISOString(),
  },

  // 19. Enugu State (Inactive)
  {
    code: "ENUGU",
    name: "Enugu State",
    capital: "Enugu",
    zone: "SOUTH_EAST",
    zoneLabel: "South East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Enugu North (Independence Layout, GRA), Enugu South, Enugu East, Nsukka",
    lgas: [
      "Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti",
      "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka",
      "Oji River", "Udenu", "Udi", "Uzo Uwani"
    ],
    coordinates: { lat: 6.4584, lng: 7.5464 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 540,
    updatedAt: new Date().toISOString(),
  },

  // 20. Gombe State (Inactive)
  {
    code: "GOMBE",
    name: "Gombe State",
    capital: "Gombe",
    zone: "NORTH_EAST",
    zoneLabel: "North East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Gombe Metropolis, Akko, Yamaltu/Deba",
    lgas: [
      "Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami",
      "Nafada", "Shongom", "Yamaltu/Deba"
    ],
    coordinates: { lat: 10.2897, lng: 11.1673 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 130,
    updatedAt: new Date().toISOString(),
  },

  // 21. Imo State (Inactive)
  {
    code: "IMO",
    name: "Imo State",
    capital: "Owerri",
    zone: "SOUTH_EAST",
    zoneLabel: "South East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Owerri Municipal, Owerri North, Owerri West, Orlu",
    lgas: [
      "Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North",
      "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli",
      "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema",
      "Okigwe", "Onuimo", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal",
      "Owerri North", "Owerri West"
    ],
    coordinates: { lat: 5.4836, lng: 7.0333 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 460,
    updatedAt: new Date().toISOString(),
  },

  // 22. Jigawa State (Inactive)
  {
    code: "JIGAWA",
    name: "Jigawa State",
    capital: "Dutse",
    zone: "NORTH_WEST",
    zoneLabel: "North West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Dutse, Hadejia, Gumel, Kazaure",
    lgas: [
      "Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki",
      "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kazaure",
      "Kiri Kasama", "Kiyawa", "Kaugama", "Maigatari", "Malam Madori", "Miga", "Ringim",
      "Roni", "Sule Tankarkar", "Taura", "Yankwashi"
    ],
    coordinates: { lat: 11.7584, lng: 9.3389 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 110,
    updatedAt: new Date().toISOString(),
  },

  // 23. Kaduna State (Inactive)
  {
    code: "KADUNA",
    name: "Kaduna State",
    capital: "Kaduna",
    zone: "NORTH_WEST",
    zoneLabel: "North West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Kaduna North (Malali, Ungwan Rimi), Kaduna South, Chikun (Barnawa), Zaria",
    lgas: [
      "Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia",
      "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau",
      "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"
    ],
    coordinates: { lat: 10.5105, lng: 7.4165 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 890,
    updatedAt: new Date().toISOString(),
  },

  // 24. Katsina State (Inactive)
  {
    code: "KATSINA",
    name: "Katsina State",
    capital: "Katsina",
    zone: "NORTH_WEST",
    zoneLabel: "North West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Katsina Metropolis, Daura, Funtua",
    lgas: [
      "Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume",
      "Danja", "Dan Musa", "Daura", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia",
      "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua",
      "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana",
      "Sandamu", "Zango"
    ],
    coordinates: { lat: 12.9887, lng: 7.6009 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 220,
    updatedAt: new Date().toISOString(),
  },

  // 25. Kebbi State (Inactive)
  {
    code: "KEBBI",
    name: "Kebbi State",
    capital: "Birnin Kebbi",
    zone: "NORTH_WEST",
    zoneLabel: "North West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Birnin Kebbi, Argungu, Yauri, Zuru",
    lgas: [
      "Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza",
      "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski",
      "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"
    ],
    coordinates: { lat: 12.4504, lng: 4.1999 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 95,
    updatedAt: new Date().toISOString(),
  },

  // 26. Kogi State (Inactive)
  {
    code: "KOGI",
    name: "Kogi State",
    capital: "Lokoja",
    zone: "NORTH_CENTRAL",
    zoneLabel: "North Central",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Lokoja, Okene, Kabba/Bunu, Idah",
    lgas: [
      "Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu",
      "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro", "Ofu", "Ogori/Magongo",
      "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"
    ],
    coordinates: { lat: 7.7969, lng: 6.7405 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 280,
    updatedAt: new Date().toISOString(),
  },

  // 27. Kwara State (Inactive)
  {
    code: "KWARA",
    name: "Kwara State",
    capital: "Ilorin",
    zone: "NORTH_CENTRAL",
    zoneLabel: "North Central",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Ilorin South (GRA), Ilorin West, Ilorin East, Offa",
    lgas: [
      "Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South",
      "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"
    ],
    coordinates: { lat: 8.4966, lng: 4.5421 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 410,
    updatedAt: new Date().toISOString(),
  },

  // 28. Nasarawa State (Inactive)
  {
    code: "NASARAWA",
    name: "Nasarawa State",
    capital: "Lafia",
    zone: "NORTH_CENTRAL",
    zoneLabel: "North Central",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Karu (Mararaba, Nyanya border corridor), Lafia, Keffi, Akwanga",
    lgas: [
      "Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa",
      "Nasarawa Egon", "Obi", "Toto", "Wamba"
    ],
    coordinates: { lat: 8.4932, lng: 8.5153 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 480,
    updatedAt: new Date().toISOString(),
  },

  // 29. Niger State (Inactive)
  {
    code: "NIGER",
    name: "Niger State",
    capital: "Minna",
    zone: "NORTH_CENTRAL",
    zoneLabel: "North Central",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Suleja (Madalla border corridor), Minna, Bida, Kontagora",
    lgas: [
      "Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara",
      "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa",
      "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"
    ],
    coordinates: { lat: 9.6139, lng: 6.5569 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 350,
    updatedAt: new Date().toISOString(),
  },

  // 30. Ogun State (Inactive)
  {
    code: "OGUN",
    name: "Ogun State",
    capital: "Abeokuta",
    zone: "SOUTH_WEST",
    zoneLabel: "South West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Abeokuta South, Obafemi Owode (Mowe, Ibafo), Ota (Ado-Odo), Sagamu, Ijebu Ode",
    lgas: [
      "Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ewekoro", "Ifo", "Ijebu East",
      "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia",
      "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Sagamu",
      "Yewa North", "Yewa South"
    ],
    coordinates: { lat: 7.1557, lng: 3.3451 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 760,
    updatedAt: new Date().toISOString(),
  },

  // 31. Ondo State (Inactive)
  {
    code: "ONDO",
    name: "Ondo State",
    capital: "Akure",
    zone: "SOUTH_WEST",
    zoneLabel: "South West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Akure South, Akure North, Ondo West, Owo",
    lgas: [
      "Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West",
      "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo",
      "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"
    ],
    coordinates: { lat: 7.2571, lng: 5.2058 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 290,
    updatedAt: new Date().toISOString(),
  },

  // 32. Osun State (Inactive)
  {
    code: "OSUN",
    name: "Osun State",
    capital: "Osogbo",
    zone: "SOUTH_WEST",
    zoneLabel: "South West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Osogbo, Olorunda, Ife Central, Ilesa East",
    lgas: [
      "Atakunmosa East", "Atakunmosa West", "Aiyedaade", "Aiyedire", "Boluwaduro", "Boripe",
      "Ede North", "Ede South", "Ife Central", "Ife East", "Ife North", "Ife South", "Egbedore",
      "Ejigbo", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole",
      "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"
    ],
    coordinates: { lat: 7.5629, lng: 4.5200 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 240,
    updatedAt: new Date().toISOString(),
  },

  // 33. Plateau State (Inactive)
  {
    code: "PLATEAU",
    name: "Plateau State",
    capital: "Jos",
    zone: "NORTH_CENTRAL",
    zoneLabel: "North Central",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Jos North (GRA), Jos South (Bukuru), Jos East",
    lgas: [
      "Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam",
      "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan",
      "Riyom", "Shendam", "Wase"
    ],
    coordinates: { lat: 9.8965, lng: 8.8583 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 375,
    updatedAt: new Date().toISOString(),
  },

  // 34. Sokoto State (Inactive)
  {
    code: "SOKOTO",
    name: "Sokoto State",
    capital: "Sokoto",
    zone: "NORTH_WEST",
    zoneLabel: "North West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Sokoto North, Sokoto South, Wamakko",
    lgas: [
      "Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela",
      "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North",
      "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"
    ],
    coordinates: { lat: 13.0059, lng: 5.2476 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 165,
    updatedAt: new Date().toISOString(),
  },

  // 35. Taraba State (Inactive)
  {
    code: "TARABA",
    name: "Taraba State",
    capital: "Jalingo",
    zone: "NORTH_EAST",
    zoneLabel: "North East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Jalingo, Wukari, Bali",
    lgas: [
      "Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido",
      "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"
    ],
    coordinates: { lat: 8.8937, lng: 11.3596 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 120,
    updatedAt: new Date().toISOString(),
  },

  // 36. Yobe State (Inactive)
  {
    code: "YOBE",
    name: "Yobe State",
    capital: "Damaturu",
    zone: "NORTH_EAST",
    zoneLabel: "North East",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Damaturu, Potiskum, Gashua",
    lgas: [
      "Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko",
      "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"
    ],
    coordinates: { lat: 11.7470, lng: 11.9608 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 105,
    updatedAt: new Date().toISOString(),
  },

  // 37. Zamfara State (Inactive)
  {
    code: "ZAMFARA",
    name: "Zamfara State",
    capital: "Gusau",
    zone: "NORTH_WEST",
    zoneLabel: "North West",
    isActive: false,
    status: "INACTIVE",
    coverageSummary: "Gusau, Kaura Namoda, Talata Mafara",
    lgas: [
      "Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau",
      "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi"
    ],
    coordinates: { lat: 12.1628, lng: 6.6613 },
    activeArtisansCount: 0,
    activeEstatesCount: 0,
    totalBookingsCount: 0,
    waitlistCount: 90,
    updatedAt: new Date().toISOString(),
  },
];
