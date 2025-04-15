import { Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PropertyFilterProps {
  onFilterChange: (filters: {
    minPrice: string;
    maxPrice: string;
    bedrooms: string;
    location: string;
  }) => void;
  initialFilters?: {
    minPrice: string;
    maxPrice: string;
    bedrooms: string;
    location: string;
  };
}

const PropertyFilters = ({ 
  onFilterChange, 
  initialFilters 
}: PropertyFilterProps) => {
  const [minPrice, setMinPrice] = useState(initialFilters?.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice || "");
  const [bedrooms, setBedrooms] = useState(initialFilters?.bedrooms || "");
  const [location, setLocation] = useState(initialFilters?.location || "");

  // Update local state if initialFilters changes
  useEffect(() => {
    if (initialFilters) {
      setMinPrice(initialFilters.minPrice || "");
      setMaxPrice(initialFilters.maxPrice || "");
      setBedrooms(initialFilters.bedrooms || "");
      setLocation(initialFilters.location || "");
    }
  }, [initialFilters]);

  const handleFilter = () => {
    // Clean and validate filter values before sending
    const filters = {
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
      bedrooms: bedrooms.trim(),
      location: location.trim()
    };
    
    // Comment out console logs
    // console.log("=== FILTER DEBUGGING ===");
    // console.log("Sending filters from Filter component:", filters);
    // console.log("Bedroom value:", filters.bedrooms, "Type:", typeof filters.bedrooms);
    // console.log("Min Price:", filters.minPrice, "Type:", typeof filters.minPrice);
    // console.log("Max Price:", filters.maxPrice, "Type:", typeof filters.maxPrice);
    // console.log("Location:", filters.location, "Type:", typeof filters.location);
    // console.log("========================");
    
    // Apply the filters
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      location: ""
    };
    
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setLocation("");
    
    // Comment out console log
    // console.log("Resetting all filters");
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="text-sm text-white/80 block">Location</label>
        <div className="relative">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="Enter location"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="text-sm text-white/80 block">Price Range</label>
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input 
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
          <span className="text-white/50">-</span>
          <div className="flex-1">
            <input 
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm text-white/80">Bedrooms</label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help text-white/40 hover:text-white/60 transition">
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border border-white/20 text-white text-xs">
                Selecting a number shows properties with exactly that many bedrooms
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, '5+'].map((num) => (
            <button
              key={num}
              type="button" 
              className={`px-3 py-2 rounded-lg border transition-all ${
                bedrooms === num.toString()
                  ? 'bg-white text-black border-white'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
              onClick={() => {
                // Ensure we always store as string
                const value = num.toString();
                // Comment out console log
                // console.log(`Setting bedroom filter to: ${value}`);
                setBedrooms(value);
              }}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
      
      <Button 
        onClick={handleFilter}
        className="w-full bg-white text-black hover:bg-white/90 transition"
      >
        Apply Filters
      </Button>
      
      {/* Updated reset button to use the handleReset function */}
      {(minPrice || maxPrice || bedrooms || location) && (
        <button
          onClick={handleReset}
          className="w-full text-center text-sm text-white/60 hover:text-white/80 transition mt-2"
        >
          Reset filters
        </button>
      )}
    </div>
  );
};

export default PropertyFilters;