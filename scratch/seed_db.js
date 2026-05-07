const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://eoeneizwhhdsnfxbcszm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZW5laXp3aGhkc25meGJjc3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTA0MTEsImV4cCI6MjA5MjY4NjQxMX0.vg8rPTMFV01AA7M6-dNKJ-G4XqlPA86WwZbPKN7MotM'
);

async function seed() {
  console.log("Seeding students...");
  const students = [
    { name: 'Aarav Patel', usn: '4SH24CS001', branch_code: 'CS' },
    { name: 'Ishita Sharma', usn: '4SH24AI002', branch_code: 'AI' },
    { name: 'Vivaan Desai', usn: '4SH24IS003', branch_code: 'IS' },
    { name: 'Diya Reddy', usn: '4SH24CS004', branch_code: 'CS' },
    { name: 'Rohan Gupta', usn: '4SH24CS005', branch_code: 'CS' },
    { name: 'Kavya Singh', usn: '4SH24AI006', branch_code: 'AI' },
    { name: 'Aditya Verma', usn: '4SH24IS007', branch_code: 'IS' },
    { name: 'Meera Nair', usn: '4SH24CS008', branch_code: 'CS' },
    { name: 'Arjun Kumar', usn: '4SH24CS009', branch_code: 'CS' },
    { name: 'Sanya Joshi', usn: '4SH24AI010', branch_code: 'AI' },
    { name: 'Aryan Rao', usn: '4SH24IS011', branch_code: 'IS' },
    { name: 'Priya Menon', usn: '4SH24CS012', branch_code: 'CS' },
    { name: 'Rahul K', usn: '4SH24CS013', branch_code: 'CS' },
    { name: 'Ananya Pillai', usn: '4SH24AI014', branch_code: 'AI' },
    { name: 'Krishna Iyer', usn: '4SH24IS015', branch_code: 'IS' }
  ];

  const { error: studentError } = await supabase.from('students').insert(students);
  if (studentError) {
    console.error("Error seeding students:", studentError);
  } else {
    console.log("Successfully seeded 15 students.");
  }


}

seed();
