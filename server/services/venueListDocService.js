const { createCanvas, loadImage } = require('@napi-rs/canvas');
const {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} = require('docx');

const NAVY = '0F2147';
const BORDER = 'CBD5E1';
const FONT = 'Calibri';
// Twips: these add up to the width of an A4 landscape page inside its margins.
const COLUMNS = [800, 3300, 4100, 2400, 4800];
const PAGE_MARGIN = 720;
const IMAGE_BOX = { width: 280, height: 175 };
const STORED_IMAGE_WIDTH = 700;

const borders = Object.fromEntries(['top', 'bottom', 'left', 'right'].map((side) => [side, { style: BorderStyle.SINGLE, size: 4, color: BORDER }]));

// Stored IDs are up to 1600px; at this size a list of hundreds of delegates stays small enough to email.
const shrinkIdImage = async (buffer) => {
  const image = await loadImage(buffer);
  const scale = Math.min(1, STORED_IMAGE_WIDTH / image.width);
  const canvas = createCanvas(Math.round(image.width * scale), Math.round(image.height * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return { data: await canvas.encode('jpeg', 78), width: canvas.width, height: canvas.height };
};

const text = (value, options = {}) => new TextRun({ text: String(value ?? ''), font: FONT, size: 20, ...options });

const cell = (children, index, options = {}) => new TableCell({
  children,
  borders,
  verticalAlign: VerticalAlign.CENTER,
  width: { size: COLUMNS[index], type: WidthType.DXA },
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  ...options,
});

const headerRow = () => new TableRow({
  tableHeader: true,
  cantSplit: true,
  children: ['S. No.', 'Name', 'Email', 'Phone', 'Photo ID'].map((label, index) => cell(
    [new Paragraph({ children: [text(label, { bold: true, color: 'FFFFFF' })] })],
    index,
    { shading: { type: ShadingType.CLEAR, color: 'auto', fill: NAVY } }
  )),
});

const photoParagraph = (photo) => {
  if (!photo) return new Paragraph({ children: [text('Image could not be loaded', { color: 'B91C1C', bold: true })] });
  const scale = Math.min(IMAGE_BOX.width / photo.width, IMAGE_BOX.height / photo.height, 1);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new ImageRun({
      type: 'jpg',
      data: photo.data,
      transformation: { width: Math.round(photo.width * scale), height: Math.round(photo.height * scale) },
      altText: { title: 'Photo ID', description: 'Photo ID', name: 'Photo ID' },
    })],
  });
};

const delegateRow = (delegate, index) => new TableRow({
  cantSplit: true,
  children: [
    cell([new Paragraph({ children: [text(index + 1)] })], 0),
    cell([new Paragraph({ children: [text(delegate.name, { bold: true })] })], 1),
    cell([new Paragraph({ children: [text(delegate.email)] })], 2),
    cell([new Paragraph({ children: [text(delegate.phone)] })], 3),
    cell([
      photoParagraph(delegate.photo),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [text(`${delegate.idType}: ${delegate.idNumber}`, { size: 18 })] }),
    ], 4),
  ],
});

// delegates: [{ name, email, phone, idType, idNumber, photo: { data, width, height } | null }]
const buildVenueListDoc = (delegates, generatedOn = new Date()) => {
  const date = generatedOn.toLocaleDateString('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' });
  const doc = new Document({
    title: 'GHC 2026 Delegate ID List',
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 },
          margin: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
        },
      },
      children: [
        new Paragraph({ spacing: { after: 60 }, children: [text('Global Healthcare Conclave 2026: Delegate ID List', { bold: true, size: 34, color: NAVY })] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [text(`28–29 November 2026, Bharat Mandapam, New Delhi. ${delegates.length} delegate(s). Generated on ${date}.`, { color: '475467' })],
        }),
        new Table({
          width: { size: COLUMNS.reduce((sum, width) => sum + width, 0), type: WidthType.DXA },
          columnWidths: COLUMNS,
          rows: [headerRow(), ...delegates.map(delegateRow)],
        }),
      ],
    }],
  });
  return Packer.toBuffer(doc);
};

module.exports = { buildVenueListDoc, shrinkIdImage };
