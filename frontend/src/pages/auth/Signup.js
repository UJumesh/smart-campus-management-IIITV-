import React, { useState } from "react";

function Signup() {

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"}}>
      <div style={{width:"400px",padding:"30px",boxShadow:"0 0 10px rgba(0,0,0,0.1)"}}>
        <h2 style={{textAlign:"center"}}>Campus Registration</h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            onChange={handleChange}
            required
          />

          <br/><br/>

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            onChange={handleChange}
            required
          />

          <br/><br/>

          <input
            type="email"
            name="email"
            placeholder="IIIT Email"
            onChange={handleChange}
            required
          />

          <br/><br/>

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <br/><br/>

          <button type="submit">Create Account</button>

        </form>
      </div>
    </div>
  );
}

export default Signup;