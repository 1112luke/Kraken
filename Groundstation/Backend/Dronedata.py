class DroneData:
    def __init__(self):
        self.drone = {
            "alt": 0,
            "lng": 0,
            "lat": 0,
            "hdg": 0,
            "sysid": 0,
        }

        self.antenna = {
            "lng": 0,
            "lat": 0,
            "hdg": 0,
            "ang": 0,
            "gain": 0,
            "toradio": 0,
            "reading": 0,
            "collecting": 0,
            "connected": 0,
            "frequency": 0,
        }

        self.program = {
            "status": "",
            "connected": 0,
        }

        self.circledata = {
            "circle": None,
            "maxlines": None,
        }

        self.sweepdata = {
            "sweep": None,
            "target": None,
        }

        self.DFdata = {
            "measurements": [],
        }

    def to_dict(self):
        """Return the complete data structure as a dictionary."""
        return {
            "drone": self.drone,
            "antenna": self.antenna,
            "program": self.program,
            "circledata": self.circledata,
            "sweepdata": self.sweepdata,
            "DFdata": self.DFdata,
        }

    def reset(self):
        """Reset all fields to initial values."""
        self.__init__()
