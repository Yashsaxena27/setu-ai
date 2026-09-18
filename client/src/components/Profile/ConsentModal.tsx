import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { getProfile, saveConsent } from "../../services/profileApi";
import toast from "react-hot-toast";

export default function ConsentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const res = await getProfile();
        // If profile exists and consent is not given, show modal
        // Note: For this phase, we assume the API returns consent_given
        if (res && !(res as any).consent_given) {
          setIsOpen(true);
        }
      } catch (err) {
        // If error or no profile, we might still want to show it, or ignore
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkConsent();
  }, []);

  const handleConsent = async () => {
    setSaving(true);
    try {
      await saveConsent();
      toast.success("Consent granted");
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to save consent");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // prevent closing without consent for now
      title="Data Consent & Privacy"
    >
      <div className="space-y-4 pt-2">
        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          Setu AI requires your consent to securely store and process your profile data to match you with eligible government schemes. Your data is encrypted and will not be shared with third parties without your explicit permission.
        </p>
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 font-medium">
          By proceeding, you agree to our Terms of Service and Privacy Policy. You can revoke this consent at any time from your Account Settings.
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={handleConsent} disabled={saving}>
            {saving ? "Saving..." : "I Agree"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
