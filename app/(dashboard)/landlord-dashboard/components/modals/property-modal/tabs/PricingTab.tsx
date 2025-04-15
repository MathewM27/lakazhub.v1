import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FormData } from "../types"

interface PricingTabProps {
  formData: FormData
  onChange: (formData: Partial<FormData>) => void
  onPrev: () => void
  onSubmit: () => Promise<void>
  isSubmitting: boolean
  isUploading: boolean
  onSuccess?: () => void // New prop for handling successful submission
}

export default function PricingTab({ 
  formData, 
  onChange, 
  onPrev, 
  onSubmit,
  isSubmitting,
  isUploading,
  onSuccess
}: PricingTabProps) {
  // Handle form input changes
  const handleInputChange = (field: string, value: string | number | boolean) => {
    onChange({
      [field]: value
    })
  }

  // Handle utility checkbox changes
  const handleUtilityChange = (utility: string, checked: boolean) => {
    onChange({
      utilities: {
        ...formData.utilities,
        [utility]: checked
      }
    })
  }

  // Handle form submission with success callback
  const handleSubmit = async () => {
    await onSubmit();
    // Call onSuccess callback after successful submission if it exists
    if (!isSubmitting && onSuccess) {
      onSuccess();
    }
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
        <div>
          <Label htmlFor="monthly-rent">Monthly Rent ($)</Label>
          <Input
            id="monthly-rent"
            type="number"
            placeholder="e.g. 1200"
            value={formData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="security-deposit">Security Deposit ($)</Label>
          <Input
            id="security-deposit"
            type="number"
            placeholder="e.g. 1200"
            value={formData.deposit}
            onChange={(e) => handleInputChange("deposit", e.target.value)}
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

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? "Saving..." : isUploading ? "Uploading..." : "Save Property"}
        </Button>
      </div>
    </div>
  )
}