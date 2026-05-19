import React, { useState } from 'react';
import { useRiders, useRiderLocations } from '../hooks/useRiders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Bike, Plus, Trash2, MapPin } from 'lucide-react';
import DeliveryMap from '../components/DeliveryMap';

const AdminRidersPage: React.FC = () => {
  const { riders, isLoading, addRider, updateRider, deleteRider } = useRiders();
  const { locations } = useRiderLocations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');

  const handleAddRider = () => {
    if (!name.trim()) return;
    addRider.mutate({ name: name.trim(), phone: phone || undefined, vehicle_type: vehicleType });
    setOpen(false);
    setName('');
    setPhone('');
  };

  const handleStatusChange = (riderId: string, status: string) => {
    updateRider.mutate({ id: riderId, status } as any);
  };

  const riderLocationsMap = new Map(locations.map(l => [l.rider_id, l]));

  const mapMarkers = locations.map(l => ({
    lat: l.lat,
    lng: l.lng,
    label: riders.find(r => r.id === l.rider_id)?.name || 'Rider',
    type: 'rider' as const,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bike className="w-7 h-7" /> Rider Management
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Rider</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Rider</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Rider name" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddRider} className="w-full" disabled={addRider.isPending}>
                Add Rider
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Map */}
      {mapMarkers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Live Rider Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryMap markers={mapMarkers} height="300px" />
          </CardContent>
        </Card>
      )}

      {/* Riders List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map(rider => {
            const loc = riderLocationsMap.get(rider.id);
            return (
              <Card key={rider.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{rider.name}</h3>
                    <Badge variant={rider.status === 'available' ? 'default' : rider.status === 'on_delivery' ? 'secondary' : 'outline'}>
                      {rider.status}
                    </Badge>
                  </div>
                  {rider.phone && <p className="text-sm text-muted-foreground">{rider.phone}</p>}
                  <p className="text-sm">Vehicle: {rider.vehicle_type}</p>
                  {loc && (
                    <p className="text-xs text-muted-foreground">
                      📍 {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Select value={rider.status} onValueChange={(val) => handleStatusChange(rider.id, val)}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="on_delivery">On Delivery</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="destructive" size="icon" onClick={() => deleteRider.mutate(rider.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminRidersPage;
