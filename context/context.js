import { createContext, useState } from "react";

export const Data_store = createContext(null);

export default function Context({ children }) {
    const [data, setData] = useState();
  
    return (
      <Data_store.Provider value={{ data, setData }}>
        {children}
      </Data_store.Provider>
    );
}