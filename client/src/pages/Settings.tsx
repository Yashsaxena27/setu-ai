import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaTrashAlt, FaSignOutAlt, FaArrowLeft, FaShieldAlt } from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleDelete() {
    const ok = window.confirm(
      "Are you sure you want to permanently delete your account?"
    );

    if (!ok) return;

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete account");

      logout();
      toast.success("Account Deleted");
      navigate("/");
    } catch {
      toast.error("Unable to delete account");
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-16 md:pb-0">
      <Header />

      <PageContainer>
        <div className="max-w-xl mx-auto space-y-8">
          
          {/* Back button */}
          <div className="flex justify-between items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
            </Button>
            <Badge variant="accent">Citizen Identity</Badge>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h1 className="font-serif text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Account Settings
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Manage your personal identification credentials and secure details.
            </p>
          </div>

          {/* Identity details Card */}
          <Card className="border border-[#0F172A]/5 p-8 shadow-premium flex flex-col items-center sm:flex-row gap-6 bg-white">
            <Avatar name={user?.name || "Citizen"} size="lg" />
            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Citizen Name
                </span>
                <p className="text-lg font-serif font-bold text-[#0F172A]">
                  {user?.name || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </span>
                <p className="text-sm font-semibold text-slate-500">
                  {user?.email || "N/A"}
                </p>
              </div>
            </div>
          </Card>

          {/* Security status Info */}
          <Card className="border border-[#0F172A]/5 p-5 bg-[#14B8A6]/5 flex items-start gap-3">
            <FaShieldAlt className="text-[#14B8A6] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">
                Verified Security Protocols Active
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                Your profile information is transmitted securely and stored privately. Account deletion will permanently erase all search history, generated drafts, and saved profile data.
              </p>
            </div>
          </Card>

          {/* Actions grid */}
          <div className="space-y-3">
            <Button
              onClick={logout}
              className="w-full justify-between"
            >
              <span>Sign Out of Account</span>
              <FaSignOutAlt />
            </Button>

            <Button
              onClick={handleDelete}
              variant="danger"
              className="w-full justify-between"
            >
              <span>Permanently Delete Account</span>
              <FaTrashAlt />
            </Button>
          </div>

        </div>
      </PageContainer>

      <Footer />
      <BottomBar />
    </main>
  );
}