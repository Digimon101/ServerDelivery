// controllers/shipmentController.js
let shipments = []; // ใช้ Array เก็บชั่วคราว หรือเชื่อม DB จริง
let nextShipmentId = 1;

exports.getAllShipments = (req, res) => {
  res.json(shipments);
};

exports.createShipment = (req, res) => {
  const shipment = {
    ShipmentID: nextShipmentId++,
    SenderID: req.body.SenderID,
    RiderID: req.body.RiderID,
    OriginAddressID: req.body.OriginAddressID,
    ReceiverName: req.body.ReceiverName,
    ReceiverPhone: req.body.ReceiverPhone,
    Destination_Street: req.body.Destination_Street,
    Destination_City: req.body.Destination_City,
    Destination_Province: req.body.Destination_Province,
    Destination_PostalCode: req.body.Destination_PostalCode,
    ItemDescription: req.body.ItemDescription,
    ShippingCost: req.body.ShippingCost,
    PaymentMethod: req.body.PaymentMethod,
    Status: 'รอดำเนินการ',
    CreatedDate: new Date(),
  };
  shipments.push(shipment);
  res.json(shipment);
};

exports.updateShipmentStatus = (req, res) => {
  const shipmentId = parseInt(req.params.shipmentId);
  const shipment = shipments.find(s => s.ShipmentID === shipmentId);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  shipment.Status = req.body.Status || shipment.Status;
  res.json(shipment);
};
