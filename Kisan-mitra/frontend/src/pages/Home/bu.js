import React, { useState } from "react";

function App() {
  const [name, setName] = useState("");

  return (
    <div>
      <h2>Enter Name</h2>

      <input
        type="text"
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <button onClick={() => alert("Welcome " + name)}>
        Click Me
      </button>
    </div>
  );
}

export default App;
