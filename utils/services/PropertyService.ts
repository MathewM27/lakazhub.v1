// ...existing code...

// Debounce utility
function debounce(fn: (...args: any[]) => void, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Example: batch update properties
export async function batchUpdateProperties(updates: Array<{id: string, data: any}>) {
  // Call your batch API endpoint or Supabase function here
  // Example: await supabase.rpc('batch_update_properties', { updates });
}

// Example: debounced mutation
export const debouncedUpdateProperty = debounce(async (id: string, data: any) => {
  // ...call update property API...
}, 500);

// ...existing code...