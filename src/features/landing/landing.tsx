const Landing = ({username}: any) => {
    return (
        <div style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "cyan",
            display: "flex",
            flexDirection: "column",
        }}>
            <div style={{
                width: "100vw",
                height: "50px",
                backgroundColor: "black",
                top: 0,
                left: 0,
            }}/>
            <h1 style={{
                fontWeight: "bold",
                textDecoration: "underline",
                textAlign: "center",
                margin: "8px",
            }}>Hello {username}</h1>

            <h2 style={{
                fontWeight: "lighter",
                color: "red",
                textAlign: "center",
                margin: "8px",
            }}>Welcome to my website!</h2>
        </div>
    );
}

export default Landing;