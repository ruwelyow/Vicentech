import React, { useState, useEffect } from "react";
import AdminMinistries from "./AdminMinistries";
import { api } from "../../utils/axios";

const AdminMinistriesContainer = () => {
    const [ministries, setMinistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingMinistryId, setEditingMinistryId] = useState(null);
    const [ministryFields, setMinistryFields] = useState({
        name: "",
        description: "",
        image: null,
        order: 0,
    });
    const [ministryImagePreview, setMinistryImagePreview] = useState("");

    const fetchMinistries = () => {
        setLoading(true);
        api.get('/ministries').then((res) => {
            if (Array.isArray(res.data)) {
                setMinistries(res.data);
            } else if (res.data && Array.isArray(res.data.data)) {
                setMinistries(res.data.data);
            } else {
                setMinistries([]);
            }
            setLoading(false);
        }).catch((error) => {
            console.error('Failed to fetch ministries:', error);
            setMinistries([]);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchMinistries();
    }, []);

    const handleMinistryImageFile = (e, setFields, setPreview) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setFields((prev) => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return <div className="loading-users">Loading ministries...</div>;
    }

    return (
        <AdminMinistries
            ministries={ministries}
            editingMinistryId={editingMinistryId}
            ministryFields={ministryFields}
            ministryImagePreview={ministryImagePreview}
            setEditingMinistryId={setEditingMinistryId}
            setMinistryFields={setMinistryFields}
            setMinistryImagePreview={setMinistryImagePreview}
            setMinistries={setMinistries}
            handleMinistryImageFile={handleMinistryImageFile}
            fetchMinistries={fetchMinistries}
            loading={loading}
        />
    );
};

export default AdminMinistriesContainer;

