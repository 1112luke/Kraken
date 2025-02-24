export default function Button({ onpress, text }) {
    return (
        <div className="button" onClick={onpress}>
            {text}
        </div>
    );
}
