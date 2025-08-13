import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../Context/AppContext'; // Assuming this path is correct

const Doctors = () => {
  const { speciality } = useParams(); // Get doctor speciality from URL param
  const { doctors } = useContext(AppContext); // Fetch doctor data from context
  const [filterDoc, setFilterDoc] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term
  const navigate = useNavigate();

  // List of specialities for filtering and display
  const specialities = [
    'General physician',
    'Gynecologist',
    'Neurologist',
    'Dermatologist',
    'Pediatricians',
    'Cardiologist',
    'Orthopedic',
    'Ophthalmologist',
    'ENT Specialist',
    'Psychiatrist',
    'Dentist',
    'Urologist',
  ];

  // Function to apply filters based on speciality and search term
  const applyFilter = () => {
    // Filter the original 'doctors' array based on both conditions
    const filtered = doctors.filter(doc => {
      // Check if the doctor matches the selected speciality (if any)
      const matchesSpeciality = speciality ? doc.speciality === speciality : true;

      // Check if the doctor's speciality or name matches the search term (if any)
      const matchesSearchTerm = searchTerm
        ? doc.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true; // If no search term, this condition is always true

      // A doctor must satisfy both the speciality and search term conditions
      return matchesSpeciality && matchesSearchTerm;
    });

    setFilterDoc(filtered);
  };

  // Effect to re-apply filters whenever doctors data, speciality param, or search term changes
  useEffect(() => {
    applyFilter();
  }, [doctors, speciality, searchTerm]); // Added searchTerm to dependencies

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-inter">
      {/* Search Input Field */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search doctor specialization or name..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9182] transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <p className='text-lg text-gray-700 mb-4'>Browse Using Doctors Speciality</p>

      <div className='flex flex-col sm:flex-row items-start gap-6'>

        {/* Sidebar filters for specialities */}
        <div className='flex flex-col gap-3 text-sm text-gray-600 w-full sm:w-auto min-w-[200px]'>
          {specialities.map((spec, idx) => (
            <p
              key={idx}
              onClick={() => {
                // Navigate to the speciality page or clear filter if already selected
                speciality === spec ? navigate('/doctors') : navigate(`/doctors/${spec}`);
                setSearchTerm(''); // Clear search term when a speciality filter is clicked
              }}
              className={`w-full sm:w-auto px-4 py-3 rounded-lg transition-all cursor-pointer text-center sm:text-left
                hover:bg-[#e1f5f2] hover:text-[#0d9182] hover:border-[#0d9182] border border-gray-300
                ${speciality === spec ? 'bg-[#e1f5f2] text-[#0d9182] border-[#0d9182] font-medium' : ''}`}
            >
              {/* Correcting 'Pediatricians' to 'Pediatrician' for display */}
              {spec === 'Pediatricians' ? 'Pediatrician' : spec}
            </p>
          ))}
        </div>

        {/* Doctor cards display area */}
        <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {filterDoc.length > 0 ? (
            filterDoc.map((item, index) => (
              <div
                key={index}
                onClick={() => navigate(`/appointment/${item._id}`)}
                className='border border-[#0d9182] rounded-xl overflow-hidden cursor-pointer
                           hover:shadow-lg transform hover:-translate-y-2 transition-all duration-300 ease-in-out'
              >
                <img
                  src={item.image || 'https://placehold.co/400x300/E1F5F2/0D9182?text=Doctor+Image'}
                  alt={item.name}
                  className='w-full object-cover h-[180px] sm:h-[200px] rounded-t-xl'
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/E1F5F2/0D9182?text=Image+Not+Found'; }}
                />
                <div className='p-4'>
                  <div className='flex items-center gap-2 text-sm text-[#0d9182] mb-1'>
                    <span className='w-2 h-2 bg-[#0d9182] rounded-full animate-pulse'></span>
                    <span>Available</span>
                  </div>
                  <p className='text-gray-900 text-lg font-semibold mb-1'>{item.name}</p>
                  <p className='text-gray-600 text-sm'>{item.speciality}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500 text-xl">
              No doctors found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
