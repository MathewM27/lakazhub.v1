"use client";

import PropertyCard from "./property-card";
import { Property } from "../../types";
import { motion } from "framer-motion";
import { Plus, Home } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useProperties } from "../../hooks/useProperties";
import { deleteProperty } from "../../lib/utils/services/PropertyService";
import { useToast } from "../../hooks/use-toast";
import NotificationsModal from "../modals/notification-modal";

interface PropertyGridProps {
  onPropertyDetailsAction: (property: Property) => void;
  onAvailabilityAction: (property: Property) => void;
  onAddNewPropertyAction: () => void;
}

export default function PropertyGrid({ 
  onPropertyDetailsAction, 
  onAvailabilityAction, 
  onAddNewPropertyAction 
}: PropertyGridProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const { properties, loading, error, refreshProperties } = useProperties();
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const { toast } = useToast();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Filter properties based on active filter
  const filteredProperties = useMemo(() => {
    if (activeFilter === 'all') return properties;
    return properties.filter(property => property.property_type === activeFilter);
  }, [properties, activeFilter]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    refreshProperties().then(() => {
      toast({
        title: "Properties refreshed",
        description: "Your property list has been updated.",
      });
    }).catch(err => {
      toast({
        title: "Refresh failed",
        description: err.message || "Could not refresh properties",
        variant: "destructive",
      });
    });
  }, [refreshProperties, toast]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Add this function to handle property deletion
  const handleDeleteProperty = async (propertyId: string) => {
    try {
      setDeletingPropertyId(propertyId);
      
      const result = await deleteProperty(propertyId);
      
      if (result.success) {
        toast({
          title: "Property deleted",
          description: "The property has been successfully deleted",
          variant: "default"
        });
        
        // Refresh the properties list
        refreshProperties();
      } else {
        toast({
          title: "Delete failed",
          description: "There was an error deleting the property. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error during property deletion:', error);
      toast({
        title: "Delete failed",
        description: "Unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingPropertyId(null);
    }
  };

  const handleNotificationClick = (property: Property) => {
    setSelectedProperty(property);
    setNotificationModalOpen(true);
  };

  return (
    <section className="py-12 bg-black relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-px h-full bg-white/5" 
            style={{ left: `${i * 10}%` }}
          ></div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <Home className="w-4 h-4 text-black" />
                </div>
                <span className="text-white/70 text-sm font-medium">Your Property Portfolio</span>
              </motion.div>
              
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4 text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Manage Your Properties
              </motion.h2>
              
              <motion.p 
                className="text-base md:text-lg text-white/70"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                View and manage all your properties in one place with real-time information
              </motion.p>
            </div>
            
            {/* Property filters */}
            <motion.div 
              className="flex items-center gap-3 mt-6 md:mt-0 flex-wrap"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {['all', 'apartment', 'house'].map((filter) => (
                <motion.button
                  key={filter}
                  variants={itemVariants}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
                    activeFilter === filter
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </motion.button>
              ))}
              <motion.button
                variants={itemVariants}
                onClick={handleRefresh} 
                className="px-4 py-2 text-sm rounded-full transition-all duration-300 bg-white/10 text-white/70 hover:bg-white/20"
              >
                Refresh
              </motion.button>
            </motion.div>
          </div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {loading ? (
              <motion.div 
                variants={itemVariants}
                className="col-span-3 flex flex-col items-center justify-center py-20 space-y-4"
              >
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                <p className="text-white/70">Loading properties...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                variants={itemVariants}
                className="col-span-3 text-center py-12 px-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
              >
                <h3 className="text-xl font-semibold text-red-400 mb-2">Error loading properties</h3>
                <p className="text-white/80 mb-4">{error.message}</p>
                <button 
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            ) : Array.isArray(filteredProperties) && filteredProperties.length > 0 ? (
              filteredProperties.map((property) => (
                <motion.div 
                  key={property.id}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className={`transform transition-all duration-300 ${
                    deletingPropertyId === property.id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <PropertyCard
                    property={property}
                    onDetailsAction={() => onPropertyDetailsAction(property)}
                    onAvailabilityAction={() => onAvailabilityAction(property)}
                    onNotificationsAction={handleNotificationClick}
                    onDeleteAction={handleDeleteProperty}
                  />
                </motion.div>
              ))
            ) : (
              <motion.p 
                variants={itemVariants}
                className="text-white col-span-3 text-center py-12 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
              >
                No properties found
              </motion.p>
            )}

            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="flex items-center justify-center border-dashed border-2 border-white/30 rounded-xl bg-white/5 backdrop-blur-sm overflow-hidden"
            >
              <button
                onClick={onAddNewPropertyAction}
                className="flex flex-col items-center justify-center w-full h-full py-14 px-6 text-white/80 hover:text-white transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-all">
                  <Plus className="w-7 h-7" />
                </div>
                <span className="font-medium text-lg">Add New Property</span>
                <p className="text-white/50 text-sm mt-2 text-center max-w-[200px]">
                  Click here to add a new property to your portfolio
                </p>
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      <NotificationsModal 
        open={notificationModalOpen}
        onOpenChangeAction={setNotificationModalOpen}
        property={selectedProperty ? {
          ...selectedProperty,
          id: selectedProperty.id,
          name: selectedProperty.name
        } : undefined}
      />
    </section>
  );
}