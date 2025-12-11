import DataChart from '@/app/ui/dashboard/data-chart';
export default function page(){
return (
    <main>
      <h1 className={`mb-8 text-3xl font-bold`}>
        Real-time Data Trends
      </h1>
      
      <div className="w-full lg:w-3/4 mx-auto">
        <p className="mb-4 text-gray-600">
         Data chart from the MQTT broker.
        </p>
        
        {/* Render the Chart Component */}
        <DataChart />
        
      </div>
    </main>
  );
}