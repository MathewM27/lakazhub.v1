import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormData } from "../types" // Import the FormData type
import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/utils/lib/utils"

interface BasicInfoTabProps {
  formData: FormData; 
  onChange: (formData: Partial<FormData>) => void;
  onNext: () => void;
}

// Expanded list of common locations in Mauritius
const mauritiusLocations = [
  // North
  "Grand Baie", "Pereybere", "Cap Malheureux", "Grand Gaube", "Goodlands", "Rivière du Rempart", "Mapou", "Poudre d'Or", "Calodyne", "Mont Choisy", "Trou aux Biches", "Pointe aux Canonniers", "Bain Boeuf", "Anse La Raie", "Fond du Sac", "Petit Raffray", "Amaury", "Plaines des Roches",

  // West
  "Flic en Flac", "Tamarin", "Black River", "Albion", "Cascavelle", "Petite Rivière", "La Gaulette", "Le Morne", "Case Noyale", "Bambous", "Geoffroy", "Gros Cailloux", "Richelieu", "Grande Rivière Noire",

  // South
  "Mahebourg", "Blue Bay", "Le Bouchon", "Souillac", "Surinam", "Chemin Grenier", "Bel Ombre", "Baie du Cap", "Rivière des Anguilles", "Rivière des Galets", "St Felix", "Gris Gris", "Batimarais", "Pomponnette", "Choisy", "Benares", "Grand Bois", "Camp Diable",

  // East
  "Centre de Flacq", "Bel Air", "Trou d'Eau Douce", "Palmar", "Belle Mare", "Poste Lafayette", "Roche Noires", "Quatre Cocos", "Lallmatie", "Camp de Masque", "Queen Victoria", "Sebastopol", "Beau Champ", "Deep River", "Grande Rivière Sud Est", "Providence", "Grande Retraite", "Petit Sable", "Deux Frères",

  // Central/Urban
  "Port Louis", "Curepipe", "Vacoas", "Quatre Bornes", "Rose Hill", "Beau Bassin", "Phoenix", "Ebène", "Moka", "Floréal", "Plaine Wilhems", "Pailles", "Coromandel", "Highlands", "Les Pailles", "Belle Rose", "Camp Fouquereaux", "Sorèze", "La Laura", "Le Hochet",

  // Other towns/villages
  "Triolet", "Terre Rouge", "Pamplemousses", "Montagne Longue", "Long Mountain", "Plaine Magnien", "Rose Belle", "New Grove", "Camp Diable", "Mare d'Albert", "Mare Tabac", "Petit Bel Air", "Riche Mare", "St Pierre", "Dagotière", "Verdun", "Mont Ida", "Petit Paquet", "Camp Ithier", "Camp Thorel", "Petit Gabriel", "Camp Carol", "Camp Fouquereaux", "Camp Levieux", "Henrietta", "Phoenix Les Halles", "La Louise", "Sainte Croix", "Valetta", "Bois Cheri", "La Flora", "Cluny", "Midlands", "La Marie", "Forest Side", "Gokhoola", "Petit Verger", "Beaux Songes", "Dubreuil", "Notre Dame"
];


export default function BasicInfoTab({ formData, onChange, onNext }: BasicInfoTabProps) {
  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    onChange({
      [field]: value
    })
  }

  // State for location autocomplete
  const [locationInput, setLocationInput] = useState(formData.location || "");
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Filter locations based on input
  useEffect(() => {
    if (locationInput.trim() === "") {
      setFilteredLocations([]);
      return;
    }

    const filtered = mauritiusLocations.filter(location =>
      location.toLowerCase().includes(locationInput.toLowerCase())
    );
    setFilteredLocations(filtered);
    setHighlightedIndex(-1);
  }, [locationInput]);

  // Handle selecting a location
  const handleSelectLocation = (location: string) => {
    setLocationInput(location);
    onChange({ location });
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredLocations.length === 0) return;

    // Arrow Down
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredLocations.length - 1 ? prev + 1 : prev
      );
    }
    // Arrow Up
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    }
    // Enter key
    else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectLocation(filteredLocations[highlightedIndex]);
    }
    // Escape key
    else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const highlightedElement = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

        <div className="relative">
          <Label htmlFor="location">Location</Label>
          <div className="relative" ref={inputRef}>
            <div className="flex">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  id="location"
                  placeholder="Enter location in Mauritius"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setIsOpen(true);
                    onChange({ location: e.target.value });
                  }}
                  onFocus={() => locationInput.trim() !== "" && setIsOpen(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 pr-9"
                />
                <button 
                  type="button" 
                  onClick={() => setIsOpen(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <ChevronsUpDown className="h-4 w-4 text-white/50" />
                </button>
              </div>
            </div>
            
            {isOpen && filteredLocations.length > 0 && (
              <div 
                className="absolute z-10 mt-1 w-full bg-black border border-white/10 rounded-md shadow-lg max-h-60 overflow-auto text-white"
                ref={listboxRef}
              >
                {filteredLocations.map((location, index) => (
                  <div
                    key={location}
                    onClick={() => handleSelectLocation(location)}
                    className={cn(
                      "px-3 py-2 cursor-pointer flex items-center justify-between text-white",
                      highlightedIndex === index ? "bg-white/10" : "hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-2 text-white/70" />
                      <span>{location}</span>
                    </div>
                    {location === locationInput && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
              <SelectItem value="duplex">Duplex</SelectItem>
              <SelectItem value="penthouse">Penthouse</SelectItem>
              <SelectItem value="bungalow">Bungalow</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="guesthouse">Guest House</SelectItem>
              <SelectItem value="farmhouse">Farmhouse</SelectItem>            
              <SelectItem value="other">Other</SelectItem>
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
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
                <SelectItem value="6+">6+</SelectItem>
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
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
                <SelectItem value="6+">6+</SelectItem>
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
        <Button 
          onClick={onNext} 
          disabled={!formData.location || formData.location.trim() === ""}
        >
          Next: Upload Photos
        </Button>
      </div>
    </div>
  )
}