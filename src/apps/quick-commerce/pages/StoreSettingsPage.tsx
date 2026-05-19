import React, { useState } from 'react';
import { useStoreLocations } from '../hooks/useStoreLocations';
import { useCurrency } from '@/hooks/useCurrency';
import { currencies } from '@/config/currencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Plus, Trash2, MapPin, DollarSign } from 'lucide-react';
import DeliveryMap from '../components/DeliveryMap';

const StoreSettingsPage: React.FC = () => {
  const { storeLocations, isLoading, addStoreLocation, deleteStoreLocation } = useStoreLocations();
  const { currency, updateCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('3');

  const handleAdd = () => {
    if (!name.trim() || !lat || !lng) return;
    addStoreLocation.mutate({
      name: name.trim(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      delivery_radius_km: parseFloat(radius) || 3,
    });
    setOpen(false);
    setName('');
    setLat('');
    setLng('');
    setRadius('3');
  };

  const handleMapClick = (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat.toFixed(6));
    setLng(selectedLng.toFixed(6));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7" /> Store Settings
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Store Location</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Store Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Store name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude</Label>
                  <Input value={lat} onChange={e => setLat(e.target.value)} placeholder="27.7172" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={lng} onChange={e => setLng(e.target.value)} placeholder="85.324" />
                </div>
              </div>
              <div>
                <Label>Delivery Radius (km)</Label>
                <Input value={radius} onChange={e => setRadius(e.target.value)} type="number" step="0.5" />
              </div>
              <div>
                <Label>Click map to set location</Label>
                <DeliveryMap
                  onLocationSelect={handleMapClick}
                  markers={lat && lng ? [{ lat: parseFloat(lat), lng: parseFloat(lng), label: name, type: 'store' }] : []}
                  height="250px"
                />
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={addStoreLocation.isPending}>
                Add Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Currency Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label>Store Currency</Label>
            <Select value={currency.code} onValueChange={updateCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This currency will be used across QuickCommerce analytics and storefront.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : storeLocations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4" />
            <p>No store locations configured. Add one to enable delivery.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {storeLocations.map(loc => (
            <Card key={loc.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{loc.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    📍 {loc.lat}, {loc.lng} • Radius: {loc.delivery_radius_km} km
                  </p>
                </div>
                <Button variant="destructive" size="icon" onClick={() => deleteStoreLocation.mutate(loc.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Store Locations Map</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryMap
                markers={storeLocations.map(s => ({ lat: s.lat, lng: s.lng, label: s.name, type: 'store' as const }))}
                height="400px"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StoreSettingsPage;
