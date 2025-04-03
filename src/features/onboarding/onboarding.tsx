import {useNavigate} from "react-router";

const Onboarding = ({username, setUsername}: any) => {
    let navigate = useNavigate();

    const handleChange = (e: any) => {
        e.preventDefault();
        setUsername(e.target.value);
    }

    return (<>
        <input onChange={handleChange}/>
        <button onClick={() => {
            if (username === "") {
                alert("Username is required");
            } else {
                navigate("/logged-in");
            }
        }}>Login
        </button>
    </>);
}

export default Onboarding;