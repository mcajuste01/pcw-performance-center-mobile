import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";

export default function TraineeFilters({ filters, onFilterChange, tiers }) {
  return (
    <Card className="border-gray-800 mb-6" style={{ background: '#0f0f0f' }}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" style={{ color: '#8b3dff' }} />
          <h3 className="text-white font-semibold">Filter Trainees</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-300 mb-2 block">Filter by tier</Label>
            <Select 
              value={filters.tier}
              onValueChange={(value) => onFilterChange({ ...filters, tier: value })}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tier</SelectItem>
                {tiers.map(tier => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block">Minimum Streak</Label>
            <Input
              type="number"
              min="0"
              value={filters.minStreak}
              onChange={(e) => onFilterChange({ ...filters, minStreak: parseInt(e.target.value) || 0 })}
              className="bg-gray-900 border-gray-700 text-white"
              placeholder="0"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.riskFlags}
                onCheckedChange={(checked) => onFilterChange({ ...filters, riskFlags: checked })}
                className="border-gray-700"
              />
              <span className="text-gray-300 text-sm">Show Risk Flags Only</span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}