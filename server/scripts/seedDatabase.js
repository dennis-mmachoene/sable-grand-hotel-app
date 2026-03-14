require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User     = require('../models/User');
const Room     = require('../models/Room');
const Booking  = require('../models/Booking');
const { ServiceRequest, HotelInfo } = require('../models/Other');

const daysAgo  = n => new Date(Date.now() - n * 86400000);
const daysFrom = n => new Date(Date.now() + n * 86400000);
const rand     = arr => arr[Math.floor(Math.random() * arr.length)];
const hashPw   = pw => bcrypt.hash(pw, 12);

// ─── Hotel Info ───────────────────────────────────────────────────────────────
const HOTEL_INFO = {
  name: 'Sable Grand',
  tagline: "Where Africa's Soul Meets Luxury",
  description: 'Sable Grand is Johannesburg\'s premier five-star hotel, nestled in the heart of Sandton. Offering world-class hospitality infused with the warmth and spirit of South Africa.',
  stars: 5,
  address: { street: '1 Sable Drive', city: 'Sandton', state: 'Gauteng', country: 'South Africa', zipCode: '2196', coordinates: { lat: -26.1076, lng: 28.0567 } },
  contact: { phone: '+27 11 555 0100', alternatePhone: '+27 11 555 0101', email: 'info@sablegrand.co.za', website: 'https://sablegrand.co.za' },
  social: { facebook: 'sablegrand', instagram: 'sablegrand', twitter: 'sablegrand' },
  policies: {
    checkInTime: '14:00', checkOutTime: '11:00',
    cancellationPolicy: 'Free cancellation up to 48 hours before arrival. Late cancellations subject to one night charge.',
    petPolicy: 'Pets not permitted. Certified assistance animals welcome.',
    smokingPolicy: 'Non-smoking property. Designated outdoor areas available.',
    childrenPolicy: 'Children of all ages welcome. Under-12s stay free in existing bedding.',
  },
  amenities: ['Infinity Pool','Full-Service Spa & Wellness','Fitness Centre (24/7)','Concierge Services','Business Centre','Free High-Speed Wi-Fi','Valet Parking','Airport Shuttle','Sky Bar & Lounge (Rooftop)','The Acacia Fine Dining','Pool Terrace Café','Room Service (24/7)','Laundry & Dry Cleaning','Gift Shop'],
  dining: [
    { name: 'The Acacia',       type: 'Fine Dining',    hours: '06:30–22:30', description: 'Contemporary South African and international cuisine with panoramic views.' },
    { name: 'Sky Bar & Lounge', type: 'Rooftop Bar',    hours: '16:00–01:00', description: 'Sundowner cocktails and live jazz overlooking the Sandton skyline.' },
    { name: 'Pool Terrace',     type: 'Casual Dining',  hours: '10:00–20:00', description: 'Light meals and refreshments by the infinity pool.' },
    { name: 'Room Service',     type: '24h Dining',     hours: '24/7',         description: 'Full menu available at all hours.' },
  ],
  taxRate: 15, currency: 'ZAR', timezone: 'Africa/Johannesburg', totalRooms: 68, isActive: true,
};

// ─── Staff ────────────────────────────────────────────────────────────────────
const buildStaff = async () => [
  { firstName:'Victoria', lastName:'Harrington', email:'victoria.harrington@sablegrand.co.za', password: await hashPw('Admin@SableGrand2024!'),       role:'admin',        department:'management',  shift:'morning',   employeeId:'EMP-001', phone:'+27112555001', hireDate: new Date('2018-03-15'), isActive:true },
  { firstName:'Marcus',   lastName:'Wellington', email:'marcus.wellington@sablegrand.co.za',   password: await hashPw('Manager@SableGrand2024!'),     role:'manager',      department:'management',  shift:'morning',   employeeId:'EMP-002', phone:'+27112555002', hireDate: new Date('2019-06-01'), isActive:true },
  { firstName:'Sophia',   lastName:'Chambers',   email:'sophia.chambers@sablegrand.co.za',     password: await hashPw('Reception@SableGrand2024!'),   role:'receptionist', department:'front_desk',   shift:'morning',   employeeId:'EMP-003', phone:'+27112555003', hireDate: new Date('2020-09-10'), isActive:true },
  { firstName:'Daniel',   lastName:'Reyes',      email:'daniel.reyes@sablegrand.co.za',         password: await hashPw('Reception@SableGrand2024!'),   role:'receptionist', department:'front_desk',   shift:'afternoon', employeeId:'EMP-004', phone:'+27112555004', hireDate: new Date('2021-02-15'), isActive:true },
  { firstName:'Amara',    lastName:'Osei',       email:'amara.osei@sablegrand.co.za',           password: await hashPw('Housekeeping@SableGrand2024!'),role:'housekeeping', department:'housekeeping', shift:'morning',   employeeId:'EMP-005', phone:'+27112555005', hireDate: new Date('2020-01-20'), isActive:true },
  { firstName:'James',    lastName:'Kowalski',   email:'james.kowalski@sablegrand.co.za',       password: await hashPw('Service@SableGrand2024!'),     role:'service_staff',department:'food_beverage',shift:'afternoon', employeeId:'EMP-006', phone:'+27112555006', hireDate: new Date('2022-04-01'), isActive:true },
];

// ─── Guests ───────────────────────────────────────────────────────────────────
const buildGuests = async () => [
  { firstName:'Eleanor',   lastName:'Whitfield',  email:'eleanor.whitfield@email.com',    password: await hashPw('Guest@2024!'), role:'guest', phone:'+27821234001', loyaltyPoints:2450, totalStays:8,  address:{ city:'Cape Town',        country:'South Africa' } },
  { firstName:'Liam',      lastName:'Nakamura',   email:'liam.nakamura@email.com',         password: await hashPw('Guest@2024!'), role:'guest', phone:'+27821234002', loyaltyPoints:850,  totalStays:3,  address:{ city:'Johannesburg',     country:'South Africa' } },
  { firstName:'Isabella',  lastName:'Fontaine',   email:'isabella.fontaine@email.com',     password: await hashPw('Guest@2024!'), role:'guest', phone:'+44201234003', loyaltyPoints:5100, totalStays:15, address:{ city:'London',           country:'UK' } },
  { firstName:'Ahmed',     lastName:'Al-Rashid',  email:'ahmed.alrashid@email.com',        password: await hashPw('Guest@2024!'), role:'guest', phone:'+971501234004', loyaltyPoints:1200, totalStays:4,  address:{ city:'Dubai',            country:'UAE' } },
  { firstName:'Charlotte', lastName:'Bergman',    email:'charlotte.bergman@email.com',     password: await hashPw('Guest@2024!'), role:'guest', phone:'+46701234005', loyaltyPoints:320,  totalStays:1,  address:{ city:'Stockholm',        country:'Sweden' } },
];

// ─── Rooms (ZAR pricing) ──────────────────────────────────────────────────────
const ROOMS = [
  // Standard (floor 2–3)
  { roomNumber:'201', type:'standard',     name:'Standard King',      floor:2, bedConfiguration:'king',      capacity:{adults:2,children:1}, size:28,  price:{base:1800,weekend:2100}, status:'available',    amenities:['wifi','ac','tv','safe','hair_dryer','iron','telephone','desk'],                                                          description:'A well-appointed standard room featuring a plush king bed, contemporary South African artwork and all essential amenities.' },
  { roomNumber:'202', type:'standard',     name:'Standard Twin',      floor:2, bedConfiguration:'twin',      capacity:{adults:2,children:1}, size:26,  price:{base:1650,weekend:1950}, status:'available',    amenities:['wifi','ac','tv','safe','hair_dryer','telephone','desk'],                                                                    description:'Bright and functional twin room ideal for colleagues or friends travelling together.' },
  { roomNumber:'203', type:'standard',     name:'Standard Queen',     floor:2, bedConfiguration:'queen',     capacity:{adults:2,children:1}, size:27,  price:{base:1750,weekend:2050}, status:'booked',       amenities:['wifi','ac','tv','safe','hair_dryer','iron','telephone'],                                                                    description:'Comfortable queen room with garden-facing window and all modern amenities.' },
  { roomNumber:'204', type:'standard',     name:'Standard King',      floor:2, bedConfiguration:'king',      capacity:{adults:2,children:1}, size:28,  price:{base:1800,weekend:2100}, status:'available',    amenities:['wifi','ac','tv','safe','hair_dryer','iron','telephone','desk'],                                                          description:'Spacious standard king room with a neutral, warm palette and premium linens.' },
  { roomNumber:'301', type:'standard',     name:'Superior Standard',  floor:3, bedConfiguration:'king',      capacity:{adults:2,children:1}, size:30,  price:{base:1980,weekend:2350}, status:'maintenance',  amenities:['wifi','ac','tv','safe','hair_dryer','iron','telephone','desk','sofa'],                                                 description:'Upgraded standard with extra seating and enhanced en-suite bathroom.' },
  { roomNumber:'302', type:'standard',     name:'Standard Double',    floor:3, bedConfiguration:'double',    capacity:{adults:2,children:1}, size:26,  price:{base:1700,weekend:2000}, status:'available',    amenities:['wifi','ac','tv','safe','hair_dryer','telephone'],                                                                          description:'Classic double room with clean lines and contemporary African-inspired décor.' },
  // Deluxe (floor 4–6)
  { roomNumber:'401', type:'deluxe',       name:'Deluxe City View',   floor:4, bedConfiguration:'king',      capacity:{adults:2,children:2}, size:38,  price:{base:3200,weekend:3800}, status:'available',    amenities:['wifi','ac','tv','minibar','safe','bathtub','shower','city_view','coffee_machine','iron','hair_dryer','telephone','desk','sofa'],           description:'Spacious deluxe room with sweeping Sandton city views, a marble bathroom and premium furnishings.' },
  { roomNumber:'402', type:'deluxe',       name:'Deluxe King',        floor:4, bedConfiguration:'king',      capacity:{adults:2,children:2}, size:36,  price:{base:3100,weekend:3700}, status:'booked',       amenities:['wifi','ac','tv','minibar','safe','bathtub','shower','coffee_machine','hair_dryer','telephone','desk'],                              description:'Elegant deluxe king room with luxurious bedding and well-equipped work area.' },
  { roomNumber:'403', type:'deluxe',       name:'Deluxe Family',      floor:4, bedConfiguration:'two_queens',capacity:{adults:3,children:2}, size:40,  price:{base:3500,weekend:4100}, status:'available',    amenities:['wifi','ac','tv','minibar','safe','shower','city_view','coffee_machine','hair_dryer','telephone','desk'],                            description:'Generous deluxe room with two queen beds, perfect for families.' },
  { roomNumber:'501', type:'deluxe',       name:'Deluxe Pool View',   floor:5, bedConfiguration:'king',      capacity:{adults:2,children:1}, size:38,  price:{base:3400,weekend:4000}, status:'available',    amenities:['wifi','ac','tv','minibar','safe','bathtub','pool_view','coffee_machine','balcony','hair_dryer','telephone','desk','sofa'],          description:'Stunning deluxe with private balcony overlooking the infinity pool.' },
  { roomNumber:'502', type:'deluxe',       name:'Deluxe Corner',      floor:5, bedConfiguration:'king',      capacity:{adults:2,children:2}, size:42,  price:{base:3650,weekend:4300}, status:'booked',       amenities:['wifi','ac','tv','minibar','safe','bathtub','shower','city_view','coffee_machine','hair_dryer','telephone','desk','sofa'],             description:'Corner deluxe with panoramic dual-aspect city views and extra floor space.' },
  { roomNumber:'601', type:'deluxe',       name:'Premium Deluxe',     floor:6, bedConfiguration:'king',      capacity:{adults:2,children:2}, size:44,  price:{base:3900,weekend:4600}, status:'available',    amenities:['wifi','ac','tv','minibar','safe','bathtub','jacuzzi','city_view','coffee_machine','balcony','hair_dryer','telephone','desk','sofa'], description:'Premium deluxe with jacuzzi tub, private balcony and elevated city vistas.' },
  // Suites (floor 7–9)
  { roomNumber:'701', type:'suite',        name:'Junior Suite',       floor:7, bedConfiguration:'king',      capacity:{adults:3,children:2}, size:65,  price:{base:5500,weekend:6500}, status:'available',    amenities:['wifi','ac','tv','minibar','safe','bathtub','jacuzzi','city_view','coffee_machine','balcony','living_room','hair_dryer','telephone','desk','sofa','iron'],                   description:'Refined junior suite with separate living area, jacuzzi and expansive city views.' },
  { roomNumber:'702', type:'suite',        name:'Executive Suite',    floor:7, bedConfiguration:'king',      capacity:{adults:3,children:2}, size:75,  price:{base:6800,weekend:8000}, status:'booked',       amenities:['wifi','ac','tv','minibar','safe','bathtub','jacuzzi','city_view','coffee_machine','balcony','living_room','dining_area','hair_dryer','telephone','desk','sofa','iron','butler_service'], description:'Sophisticated executive suite with dining area, dedicated butler and complimentary minibar.' },
  { roomNumber:'801', type:'suite',        name:'Grand Suite',        floor:8, bedConfiguration:'king',      capacity:{adults:4,children:2}, size:90,  price:{base:9500,weekend:11000},status:'available',    amenities:['wifi','ac','tv','minibar','safe','bathtub','jacuzzi','city_view','ocean_view','coffee_machine','balcony','living_room','dining_area','kitchen','hair_dryer','telephone','desk','sofa','iron','butler_service'], description:'Magnificent grand suite spanning 90m² with dual-aspect views, full kitchen and butler.' },
  { roomNumber:'802', type:'suite',        name:'Skyline Suite',      floor:8, bedConfiguration:'king',      capacity:{adults:4,children:2}, size:85,  price:{base:8800,weekend:10200},status:'available',    amenities:['wifi','ac','tv','minibar','safe','bathtub','jacuzzi','city_view','coffee_machine','balcony','living_room','dining_area','hair_dryer','telephone','desk','sofa','butler_service'], description:'Stunning skyline suite with wrap-around views and a private entertainment lounge.' },
  { roomNumber:'901', type:'suite',        name:'Penthouse Suite',    floor:9, bedConfiguration:'king',      capacity:{adults:4,children:3}, size:120, price:{base:12000,weekend:14000},status:'available',    amenities:['wifi','ac','tv','minibar','safe','bathtub','jacuzzi','city_view','ocean_view','coffee_machine','balcony','living_room','dining_area','kitchen','hair_dryer','telephone','desk','sofa','iron','butler_service','extra_bed_available'], description:'Exquisite penthouse suite with private terrace, 360° panoramic views and 24h butler.' },
  // Presidential (floor 10)
  { roomNumber:'1001', type:'presidential', name:'Presidential Suite', floor:10, bedConfiguration:'king',    capacity:{adults:4,children:4}, size:200, price:{base:18000,weekend:22000},status:'available',   amenities:['wifi','ac','tv','minibar','safe','bathtub','jacuzzi','city_view','ocean_view','coffee_machine','balcony','living_room','dining_area','kitchen','hair_dryer','telephone','desk','sofa','iron','butler_service','extra_bed_available','pet_friendly'], description:'The pinnacle of luxury. 200m² suite with private dining, gourmet kitchen, entertainment system and 24h personal butler.' },
  { roomNumber:'1002', type:'presidential', name:'Royal Suite',        floor:10, bedConfiguration:'two_kings',capacity:{adults:6,children:4}, size:280, price:{base:28000,weekend:34000},status:'available',  amenities:['wifi','ac','tv','minibar','safe','bathtub','jacuzzi','city_view','ocean_view','coffee_machine','balcony','living_room','dining_area','kitchen','hair_dryer','telephone','desk','sofa','iron','butler_service','extra_bed_available','pet_friendly'], description:'The Royal Suite spans the entire east wing — two master bedrooms, private spa, dedicated staff team.' },
];

const TYPE_IMAGES = {
  standard:     'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  deluxe:       'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
  suite:        'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800',
  presidential: 'https://images.unsplash.com/photo-1601701119533-fde78d59b949?w=800',
};
ROOMS.forEach(r => { r.images = [{ url: TYPE_IMAGES[r.type], caption: r.name, isPrimary: true }]; });

// ─── Bookings ─────────────────────────────────────────────────────────────────
const buildBookings = (guests, rooms, receptionist) => {
  const std   = rooms.filter(r => r.type === 'standard');
  const dlx   = rooms.filter(r => r.type === 'deluxe');
  const suite = rooms.filter(r => r.type === 'suite');
  const VAT   = 0.15;

  const make = (guest, room, cin, cout, status, payStatus, paidFraction = 1, src = 'website') => {
    const nights      = Math.ceil((cout - cin) / 86400000);
    const roomRate    = room.price.base * nights;
    const taxes       = Math.round(roomRate * VAT * 100) / 100;
    const totalAmount = Math.round((roomRate + taxes) * 100) / 100;
    const paid        = payStatus === 'paid' ? totalAmount : payStatus === 'partial' ? Math.round(totalAmount * paidFraction * 100) / 100 : 0;
    return {
      guest: guest._id, room: room._id,
      checkInDate: cin, checkOutDate: cout,
      guests: { adults: 2, children: 0 },
      pricing: { roomRate, taxes, totalAmount, paidAmount: paid, balanceDue: totalAmount - paid },
      status, paymentStatus: payStatus,
      paymentMethod: rand(['credit_card','debit_card','eft','cash']),
      source: src,
      handledBy: (status === 'checked_in' || src === 'reception') ? receptionist._id : undefined,
    };
  };

  return [
    // Completed (history)
    make(guests[0], std[0],   daysAgo(60), daysAgo(57), 'completed', 'paid', 1),
    make(guests[1], dlx[0],   daysAgo(45), daysAgo(42), 'completed', 'paid', 1),
    make(guests[2], suite[0], daysAgo(30), daysAgo(27), 'completed', 'paid', 1, 'third_party'),
    make(guests[3], std[1],   daysAgo(20), daysAgo(18), 'completed', 'paid', 1, 'phone'),
    make(guests[4], dlx[1],   daysAgo(15), daysAgo(12), 'completed', 'paid', 1),
    make(guests[0], dlx[2],   daysAgo(10), daysAgo(8),  'completed', 'paid', 1),
    // Currently checked-in
    make(guests[1], suite[1], daysAgo(2),  daysFrom(3),  'checked_in', 'paid',    1),
    make(guests[2], dlx[0],   daysAgo(1),  daysFrom(4),  'checked_in', 'partial', 0.5, 'reception'),
    make(guests[3], std[2],   daysAgo(1),  daysFrom(2),  'checked_in', 'paid',    1),
    // Upcoming confirmed
    make(guests[0], suite[2], daysFrom(2),  daysFrom(6),  'confirmed', 'paid',    1),
    make(guests[4], dlx[3],   daysFrom(3),  daysFrom(7),  'confirmed', 'partial', 0.5),
    make(guests[1], std[3],   daysFrom(5),  daysFrom(8),  'confirmed', 'unpaid',  0, 'phone'),
    make(guests[2], dlx[1],   daysFrom(7),  daysFrom(10), 'confirmed', 'paid',    1),
    make(guests[3], suite[0], daysFrom(10), daysFrom(15), 'confirmed', 'paid',    1, 'third_party'),
    // Pending
    make(guests[4], std[0],   daysFrom(14), daysFrom(16), 'pending', 'unpaid', 0),
    make(guests[0], dlx[2],   daysFrom(20), daysFrom(25), 'pending', 'unpaid', 0),
    // Cancelled
    { ...make(guests[1], std[1], daysAgo(5), daysAgo(3), 'cancelled', 'refunded', 1),
      cancellation: { cancelledAt: daysAgo(6), reason: 'Travel plans changed', refundAmount: 0, refundStatus: 'processed' } },
  ];
};

// ─── Service Requests ─────────────────────────────────────────────────────────
const buildServiceRequests = (guests, rooms, hk, svc) => [
  { guest: guests[0]._id, serviceType:'room_cleaning',  title:'Room Cleaning',          description:'Please clean between 10:00–12:00 SAST.',                      roomNumber: rooms[6].roomNumber,  priority:'normal', status:'completed',   assignedTo: hk._id,  completedAt: daysAgo(1) },
  { guest: guests[1]._id, serviceType:'laundry',         title:'Laundry Pickup',         description:'3 shirts, 2 trousers, 1 jacket.',                             roomNumber: rooms[7].roomNumber,  priority:'normal', status:'in_progress', assignedTo: svc._id },
  { guest: guests[2]._id, serviceType:'food_delivery',   title:'Room Service Order',     description:'Caesar salad, grilled kingklip, sparkling water.',             roomNumber: rooms[12].roomNumber, priority:'high',   status:'completed',   assignedTo: svc._id, completedAt: daysAgo(2) },
  { guest: guests[3]._id, serviceType:'maintenance',     title:'Air Conditioning Issue', description:'AC unit making unusual noise and not cooling properly.',        roomNumber: rooms[2].roomNumber,  priority:'urgent', status:'completed',   assignedTo: hk._id,  completedAt: daysAgo(3) },
  { guest: guests[4]._id, serviceType:'extra_towels',    title:'Extra Towels',           description:'4 bath towels and 2 hand towels please.',                     roomNumber: rooms[9].roomNumber,  priority:'low',    status:'pending' },
  { guest: guests[0]._id, serviceType:'wake_up_call',    title:'Wake-up Call 06:30',     description:'Please arrange a wake-up call at 06:30 SAST tomorrow.',       roomNumber: rooms[6].roomNumber,  priority:'normal', status:'pending' },
  { guest: guests[1]._id, serviceType:'transportation',  title:'Airport Transfer',       description:'Vehicle to OR Tambo International at 11:00 on checkout day.',  roomNumber: rooms[7].roomNumber,  priority:'high',   status:'assigned', assignedTo: svc._id },
  { guest: guests[2]._id, serviceType:'spa',             title:'Spa Appointment',        description:'60-min couples massage tomorrow at 15:00.',                    roomNumber: rooms[12].roomNumber, priority:'normal', status:'pending' },
];

// ─── Main seed ────────────────────────────────────────────────────────────────
const seedDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');
  }

  if (process.argv.includes('--reset')) {
    console.log('Resetting database…');
    await Promise.all([User.deleteMany(), Room.deleteMany(), Booking.deleteMany(), ServiceRequest.deleteMany(), HotelInfo.deleteMany()]);
    console.log('Collections cleared');
  }

  const existing = await User.countDocuments();
  if (existing > 0 && !process.argv.includes('--reset')) {
    console.log('Database already seeded — skipping');
    return;
  }

  console.log('\nSeeding Sable Grand database…\n');

  try {
    await HotelInfo.create(HOTEL_INFO);
    console.log('✓ Hotel info created');

    const staffData  = await buildStaff();
    const staffUsers = await User.insertMany(staffData);
    const receptionist = staffUsers.find(u => u.role === 'receptionist' && u.shift === 'morning');
    const housekeeping = staffUsers.find(u => u.role === 'housekeeping');
    const serviceStaff = staffUsers.find(u => u.role === 'service_staff');
    console.log(`✓ ${staffUsers.length} staff accounts created`);

    const guestData  = await buildGuests();
    const guestUsers = await User.insertMany(guestData);
    console.log(`✓ ${guestUsers.length} guest accounts created`);

    const rooms = await Room.insertMany(ROOMS);
    console.log(`✓ ${rooms.length} rooms created`);

    const bookingData = buildBookings(guestUsers, rooms, receptionist);
    bookingData.forEach((b, i) => {
      const yr  = new Date().getFullYear().toString().slice(-2);
      b.bookingReference = `SG${yr}-${String(i + 1).padStart(4,'0')}`;
      b.numberOfNights   = Math.ceil((b.checkOutDate - b.checkInDate) / 86400000);
    });
    const bookings = await Booking.insertMany(bookingData);
    console.log(`✓ ${bookings.length} bookings created`);

    const srData = buildServiceRequests(guestUsers, rooms, housekeeping, serviceStaff);
    srData.forEach((sr, i) => { sr.requestNumber = `SR-${String(i + 1).padStart(4,'0')}`; });
    const srs = await ServiceRequest.insertMany(srData);
    console.log(`✓ ${srs.length} service requests created`);

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║   Sable Grand — Seed Complete                                  ║
╠════════════════════════════════════════════════════════════════╣
║   STAFF CREDENTIALS                                            ║
║   Admin:         victoria.harrington@sablegrand.co.za          ║
║                  Admin@SableGrand2024!                         ║
║   Manager:       marcus.wellington@sablegrand.co.za            ║
║                  Manager@SableGrand2024!                       ║
║   Receptionist:  sophia.chambers@sablegrand.co.za              ║
║                  Reception@SableGrand2024!                     ║
╠════════════════════════════════════════════════════════════════╣
║   GUEST ACCOUNTS  (all password: Guest@2024!)                  ║
║   eleanor.whitfield@email.com                                  ║
║   liam.nakamura@email.com                                      ║
║   isabella.fontaine@email.com                                  ║
╚════════════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => mongoose.disconnect())
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = seedDatabase;
