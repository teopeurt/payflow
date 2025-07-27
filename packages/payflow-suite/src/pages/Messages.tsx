import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import MessageList from "@/components/messaging/MessageList";

const Messages: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Messages" 
        description="Communicate with your team and clients"
      />
      <MessageList />
    </div>
  );
};

export default Messages;