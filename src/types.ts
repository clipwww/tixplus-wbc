export interface Listing {
  id: number
  concert_id: number
  from_user_id: number
  to_user_id: number
  seat_type_id: number
  ticket_count: number
  total_resale_price: number
  total_basic_price: number
  status: string
  created_at: string
  updated_at: string
  is_biddable: boolean
  listing_tickets: {
    id: number
    resale_price: number
    ticket: {
      id: number
      order_no: string
      price: number
      seat_info: string
    }
  }[]
  seat_type: {
    id: number
    name: string
  }
  concert_trade_schedule: {
    trade_schedule: {
      name: string
    }
  }
}
