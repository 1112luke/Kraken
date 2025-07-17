export default function Dropdown({ value, values, setvalue }) {
    return (
        <>
            <select
                className="dropdown"
                type="dropdown"
                onChange={(e) => {
                    setvalue(e.target.value);
                }}
                value={value}
                style={{
                    width: "80%",
                    margin: "auto",
                    marginTop: 0,
                    marginBottom: 0,
                    borderRadius: "10px",
                    textAlign: "center",
                    border: "2px solid var(--light)",
                    backgroundColor: "var(--dark)",
                    color: "var(--text)",
                }}
            >
                {values.map((val) => {
                    return <option value={val}>{val}</option>;
                })}
            </select>
        </>
    );
}
