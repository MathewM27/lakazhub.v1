import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FormData } from "../types"
import { useRef } from "react"

interface PricingTabProps {
  formData: FormData
  onChange: (formData: Partial<FormData>) => void
  onPrev: () => void
  onSubmit: () => Promise<void>
  isSubmitting: boolean
  isUploading: boolean
  onSuccess?: () => void // New prop for handling successful submission
  canSubmit?: boolean // Add this prop
}

export default function PricingTab({ 
  formData, 
  onChange, 
  onPrev, 
  onSubmit,
  isSubmitting,
  isUploading,
  onSuccess,
  canSubmit = true
}: PricingTabProps) {
  // Format number with thousand separators
  const formatNumber = (value: string | number) => {
    if (typeof value === "number") value = value.toString();
    // Remove non-digit except dot
    const cleaned = value.replace(/[^\d.]/g, "");
    // Split integer and decimal
    const [int, dec] = cleaned.split(".");
    const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return dec !== undefined ? `${formatted}.${dec}` : formatted;
  };

  // Handle input changes - specifically for number fields
  const handleInputChange = (field: string, value: string) => {
    if (field === "monthly_rent" || field === "security_deposit") { // Changed field names
      const raw = typeof value === "string" ? value.replace(/,/g, "") : value;
      onChange({ [field]: raw });
    } else {
      onChange({ [field]: value });
    }
  };

  // Handle utility checkbox changes
  const handleUtilityChange = (utility: string, checked: boolean) => {
    onChange({
      utilities: {
        ...formData.utilities,
        [utility]: checked
      }
    })
  }

  return (
    <div className="grid gap-6 py-4">
      <div>
        <h3 className="text-lg font-medium mb-4">Set Pricing & Utilities</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set your rental price and specify which utilities are included.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label htmlFor="monthly-rent" className="block mb-2 text-sm font-medium">
            Monthly Rent
          </label>
          <Input
            id="monthly-rent"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 25,000"
            value={formatNumber(formData.monthly_rent)} // Changed from 'price' to 'monthly_rent'
            onChange={e => handleInputChange("monthly_rent", e.target.value)} // Changed from 'price' to 'monthly_rent'
          />
        </div>
        <div className="mb-4">
          <label htmlFor="security-deposit" className="block mb-2 text-sm font-medium">
            Security Deposit
          </label>
          <Input
            id="security-deposit"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 25,000"
            value={formatNumber(formData.security_deposit)} // Changed from 'deposit' to 'security_deposit'
            onChange={e => handleInputChange("security_deposit", e.target.value)} // Changed from 'deposit' to 'security_deposit'
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Utilities Included</Label>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.utilities).map(([utility, value]) => (
            <div key={utility} className="flex items-center space-x-2">
              <Checkbox
                id={`utility-${utility}`}
                checked={value as boolean}
                onCheckedChange={(checked) => handleUtilityChange(utility, checked === true)}
              />
              <Label htmlFor={`utility-${utility}`}>
                {utility.charAt(0).toUpperCase() + utility.slice(1)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button 
          onClick={async () => {
            try {
              await onSubmit();
            } catch (error) {
              console.error("Error submitting form:", error);
            }
          }} 
          disabled={isSubmitting || isUploading || !canSubmit}
        >
          {isSubmitting ? "Saving..." : isUploading ? "Uploading..." : "Save Property"}
        </Button>
      </div>
    </div>
  )
}