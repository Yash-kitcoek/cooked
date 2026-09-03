import React, { useEffect, useState } from "react";
import { Pencil, Save, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
const deps = [
    "Computer Science",
    "Mechanical",
    "Civil",
    "Electronics",
    "Information Technology",
    "Chemical",
  ],
  divs = ["A", "B", "C", "D"];
export function StudentProfile() {
  const { api, setMessage } = useAuth();
  const [p, setP] = useState(null),
    [edit, setEdit] = useState(false),
    [f, setF] = useState({});
  const load = async () => {
    try {
      const x = await api("/students/me/profile");
      setP(x);
      setF(x);
    } catch (e) {
      if (e.message.includes("No academic profile")) setEdit(true);
      else setMessage(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const ch = (e) => setF({ ...f, [e.target.name]: e.target.value });
  async function save(e) {
    e.preventDefault();
    try {
      const x = await api("/students/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: f.full_name,
          department: f.department,
          prn_number: f.prn_number,
          division: f.division,
          roll_no: f.roll_no,
          year_semester: f.year_semester || null,
          contact_number: f.contact_number || null,
        }),
      });
      setP(x);
      setEdit(false);
      setMessage("Profile saved.");
    } catch (e) {
      setMessage(e.message);
    }
  }
  return (
    <div className="admin-page">
      <section className="student-hero">
        <div>
          <div className="admin-kicker">STUDENT PROFILE</div>
          <h1>Your academic identity</h1>
          <p>The profile context associated with your grievances.</p>
        </div>
        {p && !edit && (
          <button
            className="admin-button secondary"
            onClick={() => setEdit(true)}
          >
            <Pencil size={13} /> Edit
          </button>
        )}
      </section>
      {p && !edit ? (
        <section className="student-panel" style={{ maxWidth: 760 }}>
          <div className="profile-dark">
            <div className="profile-avatar">
              <User size={27} />
            </div>
            <div>
              <div className="admin-kicker">STUDENT</div>
              <h2>{p.full_name}</h2>
              <p>
                {p.department} · Roll {p.roll_no} · Division {p.division}
              </p>
            </div>
          </div>
          <div className="info-grid-student">
            {[
              ["PRN Number", p.prn_number],
              ["Year / Semester", p.year_semester || "—"],
              ["Contact Number", p.contact_number || "—"],
              ["Account ID", p.user_id],
            ].map(([a, b]) => (
              <React.Fragment key={a}>
                <span>{a}</span>
                <span>{b}</span>
              </React.Fragment>
            ))}
          </div>
        </section>
      ) : (
        <form
          className="student-panel"
          style={{ maxWidth: 820 }}
          onSubmit={save}
        >
          <div className="student-form-grid">
            {[
              ["full_name", "Full name"],
              ["prn_number", "PRN number"],
              ["roll_no", "Roll number"],
              ["contact_number", "Contact number"],
            ].map(([n, l]) => (
              <div className="student-field" key={n}>
                <label>{l}</label>
                <input
                  name={n}
                  value={f[n] || ""}
                  onChange={ch}
                  required={n !== "contact_number"}
                />
              </div>
            ))}
            <div className="student-field">
              <label>Department</label>
              <select
                name="department"
                value={f.department || ""}
                onChange={ch}
                required
              >
                <option value="">Select</option>
                {deps.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="student-field">
              <label>Division</label>
              <select
                name="division"
                value={f.division || ""}
                onChange={ch}
                required
              >
                <option value="">Select</option>
                {divs.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="student-field">
              <label>Year / Semester</label>
              <input
                name="year_semester"
                value={f.year_semester || ""}
                onChange={ch}
              />
            </div>
          </div>
          <div className="student-actions">
            <button
              type="button"
              className="admin-button secondary"
              onClick={() => p && setEdit(false)}
            >
              Cancel
            </button>
            <button className="admin-button primary">
              <Save size={13} /> Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
