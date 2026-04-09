import React, { useMemo, useRef, useState } from "react";
import { Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, Alert, Image } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from 'expo-asset';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as MediaLibrary from 'expo-media-library';

export default function App() {

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formatted = selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      setInvoiceDate(formatted);
    }
  };

  // ----- Company / Header fields -----
  const [brandName, setBrandName] = useState("মণিপুরী শৈলী");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [deliveryPartner, setDeliveryPartner] = useState("Steadfast মণিপুরী শৈলী ");
  const [invoiceDate, setInvoiceDate] = useState("");

  // ----- Bill to -----
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // ----- Footer / Company contact -----
  const [companyEmail, setCompanyEmail] = useState("supritybhttchrj@gmail.com");
  const [companyAddress, setCompanyAddress] = useState("Baluchor Bazar , Sylhet 3100");

  // ----- Line Items -----
  const [items, setItems] = useState([
    { id: 1, description: "", weight: "", unitPrice: "", qty: "" },
    { id: 2, description: "", weight: "", unitPrice: "", qty: "" },
  ]);

  const [discount, setDiscount] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("150");
  const [vat, setVat] = useState("0");
  const [payment, setPayment] = useState("");

  const nextId = useRef(3);

  const currency = (n) => {
    if (!isFinite(n)) return "0.00";
    return Number(n).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totals = useMemo(() => {
    const sub = items.reduce((sum, it) => sum + (parseFloat(it.unitPrice || 0) * parseFloat(it.qty || 0)), 0);
    const vatNum = parseFloat(vat || 0);
    const discountNum = parseFloat(discount || 0);
    const deliveryNum = parseFloat(deliveryCharge || 0);
    const grand = sub + vatNum - discountNum + deliveryNum;
    const paid = parseFloat(payment || 0);
    const due = grand - paid;
    return { sub, vat: vatNum, discount: discountNum, delivery: deliveryNum, grand, paid, due };
  }, [items, vat, discount, deliveryCharge, payment]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: nextId.current++, description: "", weight: "", unitPrice: "", qty: "1" },
    ]);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateItem = (id, key, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  };

  const validate = () => {
    if (!brandName.trim()) return "Brand name is required";
    if (!invoiceNo.trim()) return "Invoice no is required";
    if (!invoiceDate.trim()) return "Date is required";
    if (!customerName.trim()) return "Customer name is required";
    if (items.length === 0) return "Please add at least one line item";
    for (const it of items) {
      if (!it.description.trim()) return "Each item must have a description";
      const up = parseFloat(it.unitPrice);
      const q = parseFloat(it.qty);
      if (!isFinite(up) || up < 0) return "Unit price must be a valid non-negative number";
      if (!isFinite(q) || q <= 0) return "Quantity must be a valid positive number";
    }
    return null;
  };

  const buildHtml = (logoUri, qrUri) => {
    const rows = items
      .map((it, idx) => {
        const amount = parseFloat(it.unitPrice || 0) * parseFloat(it.qty || 0);
        return `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${idx + 1}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(it.description)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${escapeHtml(it.weight || "")}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">৳ ${currency(it.unitPrice)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${it.qty}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">৳ ${currency(amount)}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Invoice ${escapeHtml(invoiceNo)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans Bengali', 'Noto Sans', sans-serif; color:#111827; }
          .container { max-width: 900px; margin: 0 auto; padding: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 24px; }
          .row { display:flex; gap: 16px; }
          .between { display:flex; align-items:center; justify-content:space-between; }
          .muted { color:#6b7280; }
          .title { font-size: 28px; font-weight: 800; }
          .badge { padding: 4px 10px; border-radius: 9999px; background: #f3f4f6; font-size: 12px; }
          table { width:100%; border-collapse: collapse; margin-top: 16px; }
          th { background:#f9fafb; padding:10px; border:1px solid #e5e7eb; text-align:center; font-weight:700; }
          .totals td { padding: 6px 10px; }
          .right { text-align:right; }
          .center { text-align:center; }
        </style>
      </head>
      <body>
        <div class="container">
          
          <div style="text-align:center; margin-bottom:16px;">
            <div class="title">${escapeHtml(brandName)}</div>
            <div class="badge">INVOICE</div>
          </div>

          <div class="card">
            <div class="row" style="justify-content:space-between;">
              <div>
                <div style="font-weight:700; margin-bottom:6px;">BILL TO:</div>
                <div>${escapeHtml(customerName)}</div>
                <div class="muted">${escapeHtml(phone)}</div>
                <div class="muted" style="max-width:420px;">${escapeHtml(address)}</div>
              </div>
              <div>
                <div><strong>Invoice no:</strong> ${escapeHtml(invoiceNo)}</div>
                <div><strong>Delivery Partner:</strong> ${escapeHtml(deliveryPartner)}</div>
                <div><strong>Date:</strong> ${escapeHtml(invoiceDate)}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>PRODUCT DESCRIPTION</th>
                  <th>WEIGHT</th>
                  <th>UNIT PRICE (BDT)</th>
                  <th>QTY</th>
                  <th>AMOUNT (BDT)</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div style="width: 350px; float: right; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background-color: #f9fafb; margin-top: 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  <tr>
                    <td style="padding:6px 10px; text-align:left; font-weight:600;">SUB TOTAL</td>
                    <td style="padding:6px 10px; text-align:right;">৳ ${currency(totals.sub)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 10px; text-align:left; font-weight:600;">VAT</td>
                    <td style="padding:6px 10px; text-align:right;">৳ ${currency(totals.vat)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 10px; text-align:left; font-weight:600;">DISCOUNT</td>
                    <td style="padding:6px 10px; text-align:right;">৳ ${currency(totals.discount)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 10px; text-align:left; font-weight:600;">DELIVERY CHARGES</td>
                    <td style="padding:6px 10px; text-align:right;">৳ ${currency(totals.delivery)}</td>
                  </tr>
                  <tr style="border-top:1px solid #d1d5db;">
                    <td style="padding:6px 10px; text-align:left; font-weight:800;">GRAND TOTAL</td>
                    <td style="padding:6px 10px; text-align:right; font-weight:800;">৳ ${currency(totals.grand)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 10px; text-align:left; font-weight:600;">PAYMENT</td>
                    <td style="padding:6px 10px; text-align:right;">৳ ${currency(totals.paid)}</td>
                  </tr>
                  <tr style="border-top:1px solid #d1d5db;">
                    <td style="padding:6px 10px; text-align:left; font-weight:800;">DUE AMOUNT</td>
                    <td style="padding:6px 10px; text-align:right; font-weight:800;">৳ ${currency(totals.due)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="margin-top:24px; font-size:12px; color:#6b7280;">
              <div>${escapeHtml(companyEmail)}</div>
              <div>${escapeHtml(companyAddress)}</div>
            </div>
            
          </div>
        </div>
      </body>
    </html>`;
    return html;
  };

  const downloadToDevice = async (pdfUri, fileName) => {
    try {
      if (Platform.OS === 'android') {
        // For Android - save to Downloads folder
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/pdf'
          );
          await FileSystem.StorageAccessFramework.writeAsStringAsync(
            destinationUri,
            await FileSystem.readAsStringAsync(pdfUri, { encoding: FileSystem.EncodingType.Base64 }),
            { encoding: FileSystem.EncodingType.Base64 }
          );
          Alert.alert('Success', `PDF saved to: ${fileName}`);
          return true;
        } else {
          // Fallback to document directory
          const destUri = `${FileSystem.documentDirectory}${fileName}`;
          await FileSystem.copyAsync({ from: pdfUri, to: destUri });
          Alert.alert('Success', `PDF saved to: ${destUri}`);
          return true;
        }
      } else if (Platform.OS === 'ios') {
        // For iOS - save to documents directory and show share option
        const destUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: pdfUri, to: destUri });
        
        // Also save to media library if permission granted
        if (permissionResponse?.granted) {
          const asset = await MediaLibrary.createAssetAsync(destUri);
          await MediaLibrary.createAlbumAsync('Downloads', asset, false);
          Alert.alert('Success', `PDF saved to Downloads folder`);
        } else {
          Alert.alert('Success', `PDF saved to: ${destUri}`);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Can't generate PDF", err);
      return;
    }
  
    try {
      if (Platform.OS === "web") {
        await Print.printAsync({ html: buildHtml() });
        return;
      }
  
      // Request media library permission for iOS
      if (Platform.OS === 'ios' && !permissionResponse?.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Need permission to save PDF to device');
          return;
        }
      }
  
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: buildHtml() });
      const fileName = `Invoice-${invoiceNo.replace(/\W+/g, "_")}_${Date.now()}.pdf`;
  
      // Download to device storage
      const downloaded = await downloadToDevice(uri, fileName);
      
      if (downloaded) {
        // Optional: Also show share option
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          setTimeout(async () => {
            const share = await Sharing.shareAsync(uri, { dialogTitle: `Share ${fileName}` });
          }, 1000);
        }
      } else {
        Alert.alert("Error", "Failed to save PDF to device");
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to create PDF");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FEEBE7" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "black", marginBottom: 12 }}>Invoice Builder</Text>

        <Card>
          <SectionTitle>Header</SectionTitle>
          <Row>
            <Input label="Brand / Shop Name" value={brandName} onChangeText={setBrandName} />
            <Input label="Invoice No" value={invoiceNo} onChangeText={setInvoiceNo} />
          </Row>
          <Row>
            <Input label="Delivery Partner" value={deliveryPartner} onChangeText={setDeliveryPartner} />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flex: 1 }}>
              <Input
                label="Date"
                value={invoiceDate}
                placeholder="DD-MMM-YY"
                editable={false}
              />
            </TouchableOpacity>
          </Row>
          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}
        </Card>

        <Card>
          <SectionTitle>Bill To</SectionTitle>
          <Row>
            <Input label="Customer Name" value={customerName} onChangeText={setCustomerName} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </Row>
          <Input label="Address" value={address} onChangeText={setAddress} multiline />
        </Card>

        <Card>
          <SectionTitle>Items</SectionTitle>
          {items.map((it) => (
            <View key={it.id} style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 10, marginBottom: 12 }}>
              <Row>
                <Input style={{ flex: 2 }} label="Description" value={it.description} onChangeText={(v) => updateItem(it.id, "description", v)} />
                <Input style={{ flex: 1 }} label="Weight" value={it.weight} onChangeText={(v) => updateItem(it.id, "weight", v)} />
              </Row>
              <Row>
                <Input style={{ flex: 1 }} label="Unit Price (BDT)" value={it.unitPrice} onChangeText={(v) => updateItem(it.id, "unitPrice", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" />
                <Input style={{ flex: 1 }} label="Quantity" value={it.qty} onChangeText={(v) => updateItem(it.id, "qty", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" />
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>Amount</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700" }}>৳ {currency((parseFloat(it.unitPrice || 0) * parseFloat(it.qty || 0)) || 0)}</Text>
                </View>
              </Row>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 6 }}>
                <SmallBtn danger onPress={() => removeItem(it.id)}>Remove</SmallBtn>
              </View>
            </View>
          ))}
          <SmallBtn onPress={addItem}>+ Add Item</SmallBtn>
        </Card>

        <Card>
          <SectionTitle>Totals</SectionTitle>
          <Row>
            <Input label="Discount (BDT)" value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" />
            <Input label="Delivery Charge (BDT)" value={deliveryCharge} onChangeText={setDeliveryCharge} keyboardType="decimal-pad" />
          </Row>
          <Row>
            <Input label="VAT (BDT)" value={vat} onChangeText={setVat} keyboardType="decimal-pad" />
            <Input label="Payment (BDT)" value={payment} onChangeText={setPayment} keyboardType="decimal-pad" />
          </Row>

          <View style={{ marginTop: 8 }}>
            <TotalRow label="Sub Total" value={`৳ ${currency(totals.sub)}`} />
            <TotalRow label="VAT" value={`৳ ${currency(totals.vat)}`} />
            <TotalRow label={`Discount`} value={`৳ ${currency(totals.discount)}`} />
            <TotalRow label="Delivery" value={`৳ ${currency(totals.delivery)}`} />
            <TotalRow bold label="Grand Total" value={`৳ ${currency(totals.grand)}`} />
            <TotalRow label="Payment" value={`৳ ${currency(totals.paid)}`} />
            <TotalRow bold label="Due" value={`৳ ${currency(totals.due)}`} />
          </View>
        </Card>

        <Card>
          <SectionTitle>Footer</SectionTitle>
          <Row>
            <Input label="Company Email" value={companyEmail} onChangeText={setCompanyEmail} keyboardType="email-address" />
          </Row>
          <Input label="Company Address" value={companyAddress} onChangeText={setCompanyAddress} multiline />
        </Card>

        <TouchableOpacity onPress={onSubmit} style={{ backgroundColor: "#111827", padding: 16, borderRadius: 14, marginTop: 10, alignItems: "center" }}>
          <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Generate PDF & Download to Device</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }) {
  return <Text style={{ fontSize: 16, fontWeight: "800", marginBottom: 8 }}>{children}</Text>;
}

function Row({ children }) {
  return <View style={{ flexDirection: "row", gap: 10 }}>{children}</View>;
}

function Card({ children }) {
  return (
    <View style={{ backgroundColor: "white", borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      {children}
    </View>
  );
}

function Input({ label, style, multiline, ...props }) {
  return (
    <View style={[{ flex: 1, marginBottom: 10 }, style]}>
      <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 8,
          minHeight: multiline ? 64 : undefined,
          backgroundColor: "#fff",
          fontSize: 16,
        }}
      />
    </View>
  );
}

function TotalRow({ label, value, bold }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text style={{ fontWeight: bold ? "800" : "600", color: bold ? "#111827" : "#374151" }}>{label}</Text>
      <Text style={{ fontWeight: bold ? "800" : "700" }}>{value}</Text>
    </View>
  );
}

function SmallBtn({ children, onPress, danger }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ alignSelf: "flex-start", backgroundColor: danger ? "#ef4444" : "#0ea5e9", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginTop: 4 }}>
      <Text style={{ color: "white", fontWeight: "800" }}>{children}</Text>
    </TouchableOpacity>
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}