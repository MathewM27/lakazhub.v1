import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormData } from "../types" // Import the FormData type

interface BasicInfoTabProps {
  formData: FormData; // Use the imported FormData type
  onChange: (formData: Partial<FormData>) => void;
  onNext: () => void;
}

export default function BasicInfoTab({ formData, onChange, onNext }: BasicInfoTabProps) {
  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    onChange({
      [field]: value
    })
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="property-name">Property Name</Label>
          <Input
            id="property-name"
            placeholder="e.g. Modern Downtown Apartment"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Select 
            value={formData.location} 
            onValueChange={(value) => handleInputChange("location", value)}
          >
            <SelectTrigger id="location">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="downtown">Downtown</SelectItem>
              <SelectItem value="suburbs">Suburbs</SelectItem>
              <SelectItem value="beachfront">Beachfront</SelectItem>
              <SelectItem value="mountain">Mountain Area</SelectItem>
              <SelectItem value="countryside">Countryside</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="property-type">Property Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => handleInputChange("type", value)}
          >
            <SelectTrigger id="property-type">
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="condo">Condominium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Select 
              value={formData.bedrooms} 
              onValueChange={(value) => handleInputChange("bedrooms", value)}
            >
              <SelectTrigger id="bedrooms">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Select 
              value={formData.bathrooms} 
              onValueChange={(value) => handleInputChange("bathrooms", value)}
            >
              <SelectTrigger id="bathrooms">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Property Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your property..."
            className="min-h-[120px]"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>Next: Upload Photos</Button>
      </div>
    </div>
  )
}