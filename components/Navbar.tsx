import { Box } from "lucide-react"
import Button from "./ui/Button";
import { useOutletContext } from "react-router";

const Navbar = () => {
    const { isSignedIn, userName, signIn, signOut } = useOutletContext<AuthContext>()
    const handleAuthClick = async () => {
        if (isSignedIn) {
            try {
                const ok = await signOut();
                if (!ok) {
                    console.error('Puter sign out returned false');
                    alert('Logout was not successful.');
                }
            } catch (e) {
                console.error(`Puter sign out failed: ${e}`);
                alert('Logout failed, see console for details.');
            }

            return;
        }
        try {
            const success = await signIn();
            if (!success) {
                console.warn('Puter sign in returned false');
                alert('Login was not successful.');
            }
        } catch (e) {
            console.error(`Puter sign in failed: ${e}`);
            alert('Login failed, see console for details.');
        }
    };
  return (
    <header className="navbar">
        <nav className="inner">
            <div className="left">
                <div className="brand">
                    <Box className="logo" />
                        
                    <span className="name">
                        Roomify
                    </span>
                </div>

                <ul className="links">
                    <a href="#">Product</a>
                    <a href="#">Pricing</a>
                    <a href="#">Community</a>
                    <a href="#">Enterprise</a>

                </ul>
            </div>

            <div className="actions">
                {isSignedIn ? (
                    <>
                        <span className="greeting">
                            {userName ? `Hi, ${userName}!` : 'Signed In'}
                        </span>

                        <Button size="sm" onClick={handleAuthClick} className="btn">
                            Log Out
                        </Button>
                    </>
                ) : (
                    <>
                        <Button 
                        onClick={handleAuthClick}
                        size="sm" variant="ghost">
                        Log In
                        </Button>
                        <a href="#upload" className="cta">Get Started</a>

                    </>
                )}
                
            </div>
        </nav>
    </header>
  )
}

export default Navbar