import { createContext } from "react";


export const AppContext = createContext();

const AppContextProvider = (props) => {

    const months = ['Jan' , 'Feb' , 'Mar' , 'Apr' , 'May' , 'Jun' , 'Jul' , 'Aug' , 'Sep' , 'Oct' , 'Nov' , 'Dec']

    const slotDateFormat = (slotDate) => {
        const [day, month, year] = slotDate.split('_');
        const monthIndex = Number(month) - 1;
        const validMonth = months[monthIndex] || "Invalid";
        return `${day} ${validMonth} ${year}`;
      };
       

    const calculateAge = (dob) => 
    {
        const today = new Date();

        const birthDate = new Date(dob);

        let age = today.getFullYear() - birthDate.getFullYear();

        return age;
    }

    const value = {

        calculateAge,
        slotDateFormat
    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}


export default AppContextProvider;