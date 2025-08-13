import React from 'react';
import { assets } from '../../assets/assets'; // Assuming assets path is correct

const DoctorProfile = ({ doctorData }) => {
  // Destructure doctorData for easier access
  const {
    name,
    email,
    experience,
    about,
    speciality,
    university,
    degree,
    address, // This will be an object { line1, line2 }
    mobile,
    image, // Assuming this will be the URL of the doctor's image
  } = doctorData;

  return (
    <div className="m-5 w-full">
      <p className="mb-3 text-lg font-medium text-teal-700">Doctor Profile</p>

      <div className="bg-white border border-gray-300 px-8 py-8 rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll shadow-lg">
        {/* Doctor Image Section */}
        <div className="flex items-center gap-6 mb-8 text-gray-500 justify-center flex-col">
          <img
            className="w-32 h-32 object-cover rounded-full border-4 border-teal-500 shadow-md"
            src={image || assets.profile_placeholder} // Use doctor's image or a placeholder
            alt={`${name}'s Profile`}
          />
          <h2 className="text-3xl font-bold text-teal-800">{name}</h2>
          <p className="text-xl text-gray-600">{speciality}</p>
        </div>

        <hr className="my-6 border-gray-300" />

        {/* Doctor Details - Divided into two columns for larger screens */}
        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-700">
          {/* Left Column */}
          <div className="w-full lg:flex-1 flex flex-col gap-5">
            <div className="flex flex-col">
              <p className="text-teal-700 font-semibold mb-1">Email</p>
              <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-200">{email}</p>
            </div>

            <div className="flex flex-col">
              <p className="text-teal-700 font-semibold mb-1">Mobile Number</p>
              <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-200">{mobile}</p>
            </div>

            <div className="flex flex-col">
              <p className="text-teal-700 font-semibold mb-1">Experience</p>
              <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-200">{experience}</p>
            </div>

            <div className="flex flex-col">
              <p className="text-teal-700 font-semibold mb-1">University</p>
              <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-200">{university}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:flex-1 flex flex-col gap-5">
            <div className="flex flex-col">
              <p className="text-teal-700 font-semibold mb-1">Speciality</p>
              <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-200">{speciality}</p>
            </div>

            <div className="flex flex-col">
              <p className="text-teal-700 font-semibold mb-1">Address</p>
              <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-200">
                {address?.line1}
                {address?.line2 && `, ${address.line2}`}
              </p>
            </div>

            <div className="flex flex-col">
              <p className="text-teal-700 font-semibold mb-1">Degree</p>
              <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-200">{degree}</p>
            </div>
          </div>
        </div>

        {/* About Doctor Section */}
        <div className="mt-8">
          <p className="text-teal-700 font-semibold mb-1">About Doctor</p>
          <div className="bg-gray-50 p-3 rounded border border-gray-200 min-h-[100px] whitespace-pre-wrap">
            {about}
          </div>
        </div>

        {/* Edit Profile Button */}
         <div className="mt-8 text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;