// import { useState } from "react";
// import PropertyDetailModal from "./PropertyDetailModal";
// import TenantMessage from "./messageProperty";

// interface ParentComponentProps {
//   property: any; // Replace 'any' with the appropriate type
// }

// export default function ParentComponent({ property }: ParentComponentProps) {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isMessageOpen, setIsMessageOpen] = useState(false);

//   return (
//     <div>
      
//       <button onClick={() => setIsModalOpen(true)}>View Property Details</button>
//       {/* <PropertyDetailModal
//         open={isModalOpen}
//         onOpenChange={(open) => {
//           console.log("PropertyDetailModal open state:", open);
//           setIsModalOpen(open);
//         }}
//         property={property}
//         onMessageLandlord={() => {
//           console.log("Opening TenantMessage modal");
//           setIsMessageOpen(true);
//           console.log("isMessageOpen state after setting to true:", true);
//         }} // Open TenantMessage
//         onSaveProperty={() => console.log("Save property")} // Example function
//       /> */}
//       <TenantMessage
//         open={isMessageOpen}
//         onOpenChangeAction={(open) => {
//           console.log("TenantMessage open state:", open);
//           setIsMessageOpen(true);
//           console.log("isMessageOpen state after setting:", open);
//         }}
//         property={property}
//       />
//       {/* ...existing code... */}
//     </div>
//   );
// }