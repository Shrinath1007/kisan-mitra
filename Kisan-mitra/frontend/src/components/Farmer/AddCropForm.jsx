// src/components/Farmer/AddCropForm.jsx
import React, { useState } from "react";
import "./AddCropForm.css";

const AddCropForm = ({ onSubmit, onCancel, farms }) => {
    const [form, setForm] = useState({
        farmId: farms.length > 0 ? farms[0]._id : "",
        name: "",
        sowingDate: "",
        area: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit(form);
        } catch (error) {
            // Error is handled in the dashboard
        }
    };

    return (
        <form onSubmit={handleSubmit} className="add-crop-form">
            <div className="form-group">
                <label>Select Farm *</label>
                <select
                    name="farmId"
                    value={form.farmId}
                    onChange={handleChange}
                    required
                >
                    {farms.map((farm) => (
                        <option key={farm._id} value={farm._id}>
                            {farm.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Crop Name *</label>
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Wheat, Tomato"
                />
            </div>

            <div className="form-group">
                <label>Sowing Date *</label>
                <input
                    type="date"
                    name="sowingDate"
                    value={form.sowingDate}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Area (acres) *</label>
                <input
                    type="number"
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    required
                    min="0.1"
                    step="0.1"
                    placeholder="Area for this crop"
                />
            </div>

            <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn-primary">
                    Add Crop
                </button>
            </div>
        </form>
    );
};

export default AddCropForm;