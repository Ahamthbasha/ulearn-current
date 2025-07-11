import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction {
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  txnId: string;
  date: Date;
}

export interface IWallet extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  onModel: 'User' | 'Instructor' | 'Admin'; 
  role: 'student' | 'instructor' | 'admin'; 
  balance: number;
  transactions: ITransaction[];
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    description: { type: String, required: true },
    txnId: { type: String, required: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const WalletSchema: Schema<IWallet> = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'onModel'
    },
    onModel: {
      type: String,
      required: true,
      enum: ['User', 'Instructor', 'Admin']
    },
    role: {
      type: String,
      required: true,
      enum: ['student', 'instructor', 'admin']
    },
    balance: {
      type: Number,
      required: true,
      default: 0
    },
    transactions: {
      type: [TransactionSchema],
      default: []
    }
  },
  { timestamps: true }
);

const WalletModel = mongoose.model<IWallet>('Wallet', WalletSchema);
export default WalletModel;
