import React from 'react';

const styles = {
    container: {
        maxWidth: '800px',
        margin: '50px auto',
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
    },
    title: {
        color: '#007bff',
        marginBottom: '15px',
    },
    paragraph: {
        fontSize: '18px',
        lineHeight: '1.6',
        color: '#555',
    }
};

const Home = () => {
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Welcome to SagarSaathi (TemplateTripConnect)</h1>
            <p style={styles.paragraph}>
                This is the Minimum Viable Product (MVP) frontend built with React. 
                The platform is designed to connect users and vetted drivers with secure, 
                real-time tracking and logistics powered by our Node/Express backend.
            </p>
            <p style={styles.paragraph}>
                **Next Steps:** Go to the **Register** link to test the user registration API endpoint.
            </p>
        </div>
    );
};

export default Home;