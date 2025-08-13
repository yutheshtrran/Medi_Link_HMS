import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets"; // Assuming assets path is correct
import { AdminContext } from "../../Context/AdminContext.jsx"; // Assuming AdminContext path is correct
import { toast } from "react-toastify"; // For toast notifications
import axios from "axios"; // For API calls
import PhoneInput from "react-phone-input-2"; // Phone input component
import 'react-phone-input-2/lib/style.css'; // Styling for PhoneInput

const AddDoctor = () => {
  // State variables for all form inputs
  const [docImage, setDocImage] = useState(false); // Stores the selected image file
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [experience, setExperience] = useState("1 Year"); // Default experience
  const [about, setAbout] = useState("");
  const [speciality, setSpeciality] = useState("General physician"); // Default speciality
  // Updated: Two separate states for University and Degree
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [mobile, setMobile] = useState(""); // Stores the mobile number from PhoneInput

  // Accessing backend URL and authentication token from AdminContext
  const { backendURL, aToken } = useContext(AdminContext);

  // Handler for form submission
  const onsubmitHandler = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    // --- DEBUGGING LOGS ---
    // Log current form data to the console for debugging purposes.
    // This helps verify what state values are present before validation.
    console.log("Form Data on Submission:", {
      docImage: docImage ? "File Selected" : "No File", // Check if an image file object exists
      name,
      email,
      password,
      experience,
      about,
      speciality,
      university, // Log the new university field
      degree,     // Log the new degree field
      address1,
      address2,
      mobile, // Log the mobile number string
    });

    // --- CLIENT-SIDE VALIDATION ---
    // Validate that a doctor image has been selected
    if (!docImage) {
      toast.error("Please upload doctor image");
      return; // Stop submission if validation fails
    }

    // Validate mandatory text fields (name, email, password, about, address1, university, degree)
    // .trim() removes whitespace from both ends, so fields with only spaces are considered empty.
    if (!name.trim() || !email.trim() || !password.trim() || !about.trim() || !address1.trim() || !university.trim() || !degree.trim()) {
      toast.error("Please fill all mandatory fields (Name, Email, Password, About, Address Line 1, University, Degree)");
      return;
    }

    // Validate mobile number
    // Checks if mobile is null/undefined OR if it's an empty string after trimming whitespace.
    if (!mobile || !mobile.trim()) {
      toast.error("Please enter a mobile number");
      return;
    }

    // --- API CALL ---
    try {
      // Create a FormData object to send form data, especially for file uploads
      const formData = new FormData();
      formData.append("image", docImage);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("speciality", speciality);
      formData.append("experience", experience);
      formData.append("about", about);
      // Stringify complex objects (address) before appending to FormData
      formData.append("address", JSON.stringify({ line1: address1, line2: address2 }));
      // Updated: Append both university and degree
      formData.append("university", university);
      formData.append("degree", degree);
      formData.append("mobile", `+${mobile}`); // Prepend '+' for international format if not already handled by PhoneInput

      // Make the POST request to the backend
      const { data } = await axios.post(`${backendURL}/api/admin/add-doctor`, formData, {
        headers: { aToken }, // Include authentication token in headers
      });

      // Handle API response
      if (data.success) {
        toast.success(data.message); // Show success message

        // Reset all form fields to their initial state after successful submission
        setDocImage(false);
        setName("");
        setEmail("");
        setPassword("");
        setExperience("1 Year");
        setAbout("");
        setSpeciality("General physician");
        // Updated: Reset both university and degree
        setUniversity("");
        setDegree("");
        setAddress1("");
        setAddress2("");
        setMobile("");
      } else {
        toast.error(data.message); // Show error message from backend
      }
    } catch (error) {
      // Catch any network or API errors
      toast.error("Something went wrong! Please check your network or server.");
      console.error("API Error:", error); // Log the full error for detailed debugging
    }
  };

  return (
    <form onSubmit={onsubmitHandler} className="m-5 w-full">
      <p className="mb-3 text-lg font-medium text-teal-700">Add Doctors</p>

      <div className="bg-white border border-gray-300 px-8 py-8 rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
        {/* Doctor Image Upload Section */}
        <div className="flex items-center gap-4 mb-8 text-gray-500">
          <label htmlFor="upload-area" className="cursor-pointer">
            <img
              className="w-16 bg-gray-100 rounded-full"
              // Display selected image preview or default upload area asset
              src={docImage ? URL.createObjectURL(docImage) : assets.upload_area}
              alt="Doctor Upload"
            />
          </label>
          <input
            onChange={(e) => setDocImage(e.target.files[0])} // Update docImage state with the selected file
            type="file"
            hidden
            id="upload-area"
            accept="image/*" // Accept only image files
          />
          <p>Upload doctor<br />picture</p>
        </div>

        {/* Form Fields - Divided into two columns for larger screens */}
        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
          {/* Left Column */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-teal-700 font-semibold">Doctor Name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="border border-teal-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                type="text"
                placeholder="Doctor Name"
                required // HTML5 validation for required field
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-teal-700 font-semibold">Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="border border-teal-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                type="email"
                placeholder="Email"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-teal-700 font-semibold">Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="border border-teal-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                type="password"
                placeholder="Password"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-teal-700 font-semibold">Experience</p>
              <select
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
                className="border border-teal-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {/* Generate options for 1 to 10 years of experience */}
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={`${i + 1} Year${i === 0 ? "" : "s"}`}>
                    {i + 1} Year{i === 0 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-teal-700 font-semibold">Mobile Number</p>
              <PhoneInput
                country={"lk"} // Changed default country to Sri Lanka (LK)
                value={mobile}
                onChange={setMobile} // Update mobile state with the phone number
                inputStyle={{
                  width: "100%",
                  height: "40px",
                  border: "1px solid #14b8a6", // Tailwind's teal-500
                  borderRadius: "6px",
                }}
                buttonStyle={{
                  border: "1px solid #14b8a6",
                  borderTopLeftRadius: "6px",
                  borderBottomLeftRadius: "6px",
                }}
                required // HTML5 validation for required field
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-teal-700 font-semibold">Speciality</p>
              <select
                onChange={(e) => setSpeciality(e.target.value)}
                value={speciality}
                className="border border-teal-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {/* Options for doctor specialities */}
                <option value="General physician">General physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatricians">Pediatricians</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Gastroenterologist">Gastroenterologist</option>
                <option value="Orthopedic">Orthopedic</option>
                <option value="Ophthalmologist">Ophthalmologist</option>
                <option value="ENT Specialist">ENT Specialist</option>
                <option value="Psychiatrist">Psychiatrist</option>    
                <option value="Dentist">Dentist</option>
                <option value="Urologist">Urologist</option>  
              </select>
            </div>

            {/* Updated: Two Education Fields */}
            <div className="flex flex-col gap-1">
              <p className="text-teal-700 font-semibold">University</p>
              <input
                type="text"
                placeholder="University Name"
                className="border border-teal-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-teal-700 font-semibold">Degree</p>
              <input
                type="text"
                placeholder="Degree (e.g., MBBS, MD)"
                className="border border-teal-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                required
              />
            </div>

            {/* Address Fields */}
            <div className="flex flex-col gap-2">
              <p className="text-teal-700 font-semibold">Address</p>
              <input
                onChange={(e) => setAddress1(e.target.value)}
                value={address1}
                className="border border-teal-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                type="text"
                placeholder="Address Line 1"
                required
              />
              <input
                onChange={(e) => setAddress2(e.target.value)}
                value={address2}
                className="border border-teal-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                type="text"
                placeholder="Address Line 2"
              />
            </div>
          </div>
        </div>

        {/* About Doctor Textarea */}
        <div>
          <p className="mt-4 mb-2 text-teal-700 font-semibold">About Doctor</p>
          <textarea
            onChange={(e) => setAbout(e.target.value)}
            value={about}
            className="w-full px-4 pt-2 border border-teal-400 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="About Doctor"
            rows="4" // Added rows for better textarea display
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded"
        >
          Add Doctor
        </button>
      </div>
    </form>
  );
};

export default AddDoctor;
