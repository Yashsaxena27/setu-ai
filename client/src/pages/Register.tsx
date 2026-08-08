import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { BridgeIcon, Logo } from "../components/ui/BridgeLogo";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      toast.success("Account Created");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF8F3] font-sans">
      {/* Left Column: Branding / Trust */}
      <div className="hidden md:flex md:w-1/2 bg-[#0F172A] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-8 translate-y-8">
          <BridgeIcon className="w-[320px] h-[320px]" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-block group">
            <Logo className="text-2xl text-white group-hover:text-[#14B8A6] transition duration-200" iconClassName="h-8 w-8" />
          </Link>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <Badge variant="accent">Identity & Subscriptions</Badge>
          <h2 className="font-serif text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            Create your secure citizen profile.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Setting up an account secures your match progress. Sync eligible updates immediately, customize income brackets, and track draft revisions on your dashboard.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-semibold relative z-10">
          Setu AI adheres to secure processing guidelines. Your data is transmitted securely and stored privately.
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Get Started
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Create your account to start discovering scheme matches.
            </p>
          </div>

          <Card className="border border-[#0F172A]/5 p-8 shadow-premium">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="citizen@setu.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-full mt-2"
                loading={loading}
                disabled={loading}
              >
                Create Account
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm font-semibold text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#14B8A6] hover:text-[#0D9488] transition duration-150"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}