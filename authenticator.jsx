// Utils
const __storage__ = {
    get: (key, defaultValue) => {
        const stored = localStorage.getItem(key);
        return stored !== null ? JSON.parse(stored) : defaultValue;
    },
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// Components
const __Input__ = ({ type, placeholder, value, onChange }) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
);

const __Button__ = ({ onClick, children, secondary = false }) => (
    <button
        onClick={onClick}
        className={`w-full p-3 rounded-md font-medium transition duration-300 ${secondary
            ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
            : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
    >
        {children}
    </button>
);

const __FormField__ = ({ label, children }) => (
    <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
        {children}
    </div>
);

const __SmtpWarning__ = ({ onDismiss }) => (
    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 rounded-lg p-5 mb-6 relative" role="alert">
        <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <p className="font-bold text-yellow-700">Warning</p>
        </div>
        <p className="text-yellow-600 mb-2">
            Email verification may not work properly if SMTP is not configured. Please ensure proper SMTP setup or use manual user validation in the{' '}
            <a
                href="/_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-700 hover:text-yellow-900 underline font-medium"
            >
                admin console
            </a>.
        </p>
        <button
            onClick={onDismiss}
            className="absolute top-2 right-2 text-yellow-500 hover:text-yellow-700 transition-colors duration-200"
            aria-label="Dismiss"
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
        </button>
    </div>
);

// Auth Components
const __AuthForm__ = ({ onSubmit, isSignUp }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email && password) {
            onSubmit(email, password);
        } else {
            Swal.fire('Error', 'Please fill in all fields', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <__FormField__ label="Email">
                <__Input__
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </__FormField__>
            <__FormField__ label="Password">
                <__Input__
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </__FormField__>
            <__Button__ onClick={handleSubmit}>{isSignUp ? 'Sign Up' : 'Sign In'}</__Button__>
        </form>
    );
};

const __AuthPage__ = ({ onAuth, pb }) => {
    const [isSignUp, setIsSignUp] = React.useState(!__storage__.get('hasSignedInBefore', false));
    const [showWarning, setShowWarning] = React.useState(__storage__.get('showSmtpWarning', true));

    const handleAuth = async (email, password) => {
        try {
            if (isSignUp) {
                await pb.collection('users').create({
                    email: email,
                    password: password,
                    passwordConfirm: password
                });
                try {
                    await pb.collection('users').requestVerification(email);
                    Swal.fire('Success', 'Please check your email to verify your account. If you do not receive an email, please contact an administrator.', 'success');
                } catch (verificationError) {
                    console.error('Verification request failed:', verificationError);
                    Swal.fire('Account Created', 'Your account has been created, but email verification failed. Please contact an administrator for manual verification.', 'warning');
                }
            } else {
                const authData = await pb.collection('users').authWithPassword(email, password);
                if (!authData.record.verified) {
                    pb.authStore.clear(); // Clear the auth store if the user is not verified
                    throw new Error('Please verify your email before signing in.');
                }
            }
            __storage__.set('hasSignedInBefore', true);
            onAuth();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDismissWarning = () => {
        setShowWarning(false);
        __storage__.set('showSmtpWarning', false);
    };

    const toggleSignUp = () => {
        setIsSignUp(!isSignUp);
        setShowWarning(__storage__.get('showSmtpWarning', true));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 relative">
            <a
                href="/_/"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-full transition duration-300 flex items-center"
            >
                <i className="fas fa-cog mr-2"></i>
                Admin
            </a>

            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-3xl font-semibold mb-6 text-center text-gray-800">
                    {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </h1>
                {isSignUp && showWarning && <__SmtpWarning__ onDismiss={handleDismissWarning} />}
                <br />
                <__AuthForm__ onSubmit={handleAuth} isSignUp={isSignUp} />
                <div className="mt-4 text-center">
                    <button
                        onClick={toggleSignUp}
                        className="text-blue-500 hover:text-blue-600 transition duration-300"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main AuthComponent
const AuthComponent = ({ children }) => {
    const [pb, setPb] = React.useState(null);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isVerified, setIsVerified] = React.useState(false);

    React.useEffect(() => {
        // Load PocketBase from CDN
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pocketbase@0.21.3/dist/pocketbase.umd.js';
        script.async = true;
        script.onload = () => {
            const pocketbase = new PocketBase('http://127.0.0.1:8090');
            setPb(pocketbase);
            setIsAuthenticated(pocketbase.authStore.isValid);
            setIsVerified(pocketbase.authStore.model?.verified);
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    React.useEffect(() => {
        if (pb) {
            return pb.authStore.onChange((token, model) => {
                setIsAuthenticated(pb.authStore.isValid);
                setIsVerified(model?.verified);
            });
        }
    }, [pb]);

    const handleSignOut = async () => {
        if (pb) {
            pb.authStore.clear();
            setIsAuthenticated(false);
            setIsVerified(false);
        }
    };

    if (!pb) {
        return <div>Loading...</div>;
    }

    if (isAuthenticated && isVerified) {
        const childProps = {};
        if (React.isValidElement(children)) {
            if (!children.props.hasOwnProperty('onSignOut')) {
                console.warn('Child component is missing onSignOut prop');
                childProps.onSignOut = handleSignOut;
            }
            if (!children.props.hasOwnProperty('user')) {
                console.warn('Child component is missing user prop');
                childProps.user = pb.authStore.model;
            }
            if (!children.props.hasOwnProperty('pb')) {
                console.warn('Child component is missing pb prop');
                childProps.pb = pb;
            }
        }
        return React.cloneElement(children, childProps);
    }

    return <__AuthPage__ onAuth={() => {
        setIsAuthenticated(true);
        setIsVerified(pb.authStore.model?.verified);
    }} pb={pb} />;
};

// At the end of authenticator.jsx
window.AuthComponent = AuthComponent;