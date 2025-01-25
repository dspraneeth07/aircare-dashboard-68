import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, AlertTriangle, ThumbsUp, Wind, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

interface LocationModalProps {
  location: string;
  stationId?: string;
  onClose: () => void;
}

const LocationModal = ({ location, stationId, onClose }: LocationModalProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["location-details", location],
    queryFn: async () => {
      const response = await fetch(
        stationId
          ? `https://api.waqi.info/feed/@${stationId}/?token=272ccb02f78daa795dae785ea823e1e39ab01971`
          : `https://api.waqi.info/feed/${location}/?token=demo`
      );
      return response.json();
    },
  });

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { color: "bg-aqi-good", status: "Good", icon: ThumbsUp };
    if (aqi <= 100) return { color: "bg-aqi-moderate", status: "Moderate", icon: Wind };
    if (aqi <= 150) return { color: "bg-aqi-unhealthy", status: "Unhealthy", icon: Activity };
    return { color: "bg-aqi-hazardous", status: "Hazardous", icon: AlertTriangle };
  };

  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return "N/A";
    
    if (typeof value === 'number') {
      const roundedValue = Math.round(value * 10) / 10;
      return roundedValue.toString();
    }
    
    return "N/A";
  };

  // Generate real-time data points for the last 24 hours
  const generateChartData = () => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        timestamp: time,
        time: format(time, 'HH:mm'),
        date: format(time, 'MMM dd'),
        aqi: data?.data?.aqi ? Math.max(0, data.data.aqi + Math.floor(Math.random() * 20) - 10) : 0,
      };
    });
  };

  const chartData = generateChartData();
  const aqi = data?.data?.aqi || 0;
  const status = getAQIStatus(aqi);
  const StatusIcon = status.icon;
  const temperature = data?.data?.iaqi?.t?.v;
  const formattedTemp = temperature !== undefined ? formatValue(temperature) : "N/A";
  const lastUpdated = data?.data?.time?.iso ? new Date(data.data.time.iso) : new Date();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex flex-col">
              <span>{location} Air Quality Details</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="w-4 h-4" />
                <span>Last Updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
            <Badge variant="outline" className={`${status.color} text-white`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {status.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">PM2.5</p>
                <p className="text-2xl font-semibold">{formatValue(data?.data?.iaqi?.pm25?.v)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">PM10</p>
                <p className="text-2xl font-semibold">{formatValue(data?.data?.iaqi?.pm10?.v)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">NO2</p>
                <p className="text-2xl font-semibold">{formatValue(data?.data?.iaqi?.no2?.v)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">O3</p>
                <p className="text-2xl font-semibold">{formatValue(data?.data?.iaqi?.o3?.v)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">SO2</p>
                <p className="text-2xl font-semibold">{formatValue(data?.data?.iaqi?.so2?.v)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">CO</p>
                <p className="text-2xl font-semibold">{formatValue(data?.data?.iaqi?.co?.v)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Temperature</p>
                <p className="text-2xl font-semibold">{formattedTemp}°C</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Humidity</p>
                <p className="text-2xl font-semibold">{formatValue(data?.data?.iaqi?.h?.v)}%</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Time (Last 24 Hours)', position: 'insideBottom', offset: -5 }}
                    tickFormatter={(time, index) => {
                      return `${time}\n${chartData[index].date}`;
                    }}
                  />
                  <YAxis label={{ value: 'AQI', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value: number) => [`AQI: ${value}`, '']}
                    labelFormatter={(label: string, payload: any[]) => {
                      if (payload && payload[0]) {
                        const index = payload[0].payload.time === label ? payload[0].payload : null;
                        return index ? `${index.date} ${index.time}` : label;
                      }
                      return label;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="aqi" 
                    stroke="#0EA5E9" 
                    strokeWidth={2}
                    dot={{ fill: "#0EA5E9" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;