"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/utils/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SurveyProps {
  userId: string;
  fullName: string;
  email: string;
  open: boolean;
  onCloseAction: () => void;
}

export default function LandlordVerificationSurvey({ userId, fullName, email, open, onCloseAction }: SurveyProps) {
  const [form, setForm] = useState({
    full_name: fullName,
    email,
    is_sole_owner: "",
    represents_someone_else: "",
    relationship_to_owner: "",
    num_properties: "",
    heard_about_us: "",
    additional_info: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    // Check localStorage first for quick UX
    if (localStorage.getItem("lh_landlord_surveyed")) {
      setAlreadySubmitted(true);
      setSubmitted(true);
      return;
    }
    // Check Supabase for existing survey for this user
    async function checkSurvey() {
      const { data, error } = await supabase
        .from("landlord_verification_surveys")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (data && data.id) {
        setAlreadySubmitted(true);
        setSubmitted(true);
        localStorage.setItem("lh_landlord_surveyed", "1");
      }
    }
    if (userId && open) {
      checkSurvey();
    }
  }, [userId, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Double-check Supabase before submit
    const { data: existing } = await supabase
      .from("landlord_verification_surveys")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (existing && existing.id) {
      setAlreadySubmitted(true);
      setSubmitting(false);
      setSubmitted(true);
      localStorage.setItem("lh_landlord_surveyed", "1");
      onCloseAction();
      return;
    }
    await supabase.from("landlord_verification_surveys").insert([{
      user_id: userId,
      full_name: form.full_name,
      email: form.email,
      is_sole_owner: form.is_sole_owner === "yes",
      represents_someone_else: form.represents_someone_else === "yes",
      relationship_to_owner: form.relationship_to_owner,
      num_properties: form.num_properties,
      heard_about_us: form.heard_about_us,
      additional_info: form.additional_info,
    }]);
    setSubmitting(false);
    setSubmitted(true);
    localStorage.setItem("lh_landlord_surveyed", "1");
    onCloseAction();
  };

  if (alreadySubmitted) return null;

  return (
    <Dialog open={open}>
      <DialogContent
        className="w-full max-w-md sm:max-w-md md:max-w-md lg:max-w-md bg-zinc-900 border border-zinc-700 text-white rounded-xl shadow-xl p-0"
        style={{ maxHeight: "95vh", minWidth: "0" }}
      >
        <div className="overflow-y-auto max-h-[80vh] p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-2xl font-bold mb-2 text-amber-400">Landlord Quick Survey</h2>
            <p className="text-white/70 mb-4 text-sm">
              Help us keep LakazHub safe for everyone. This will only take a minute. In the future, we may require proof of ownership.
            </p>
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white" />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input name="email" value={form.email} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white" />
            </div>
            <div>
              <label className="block text-sm mb-1">Are you the sole owner of the property?</label>
              <select name="is_sole_owner" value={form.is_sole_owner} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white">
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {form.is_sole_owner === "no" && (
              <div>
                <label className="block text-sm mb-1">Who do you represent?</label>
                <input name="relationship_to_owner" value={form.relationship_to_owner} onChange={handleChange} className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white" />
              </div>
            )}
            <div>
              <label className="block text-sm mb-1">Are you listing on behalf of someone else?</label>
              <select name="represents_someone_else" value={form.represents_someone_else} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white">
                <option value="">Select</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">How many properties do you own/manage?</label>
              <select name="num_properties" value={form.num_properties} onChange={handleChange} required className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white">
                <option value="">Select</option>
                <option value="1">1</option>
                <option value="2-5">2-5</option>
                <option value="6-10">6-10</option>
                <option value="10+">10+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">How did you hear about us? (optional)</label>
              <input name="heard_about_us" value={form.heard_about_us} onChange={handleChange} className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white" />
            </div>
            <div>
              <label className="block text-sm mb-1">Anything else you'd like us to know? (optional)</label>
              <textarea name="additional_info" value={form.additional_info} onChange={handleChange} className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white" />
            </div>
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
